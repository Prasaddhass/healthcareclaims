"""
Enterprise-grade semantic RAG for insurance policy documents.

Designed for policy questions where the same concept can appear under different
terminology, e.g.:
  - exclusions: excluded, not covered, non-covered, not eligible, benefit exclusion,
    limitation, not payable, plan exclusion
  - authorization: prior authorization, pre-authorization, preapproval,
    pre-certification, precertification, approval required

Pipeline:
PDF -> structure-aware chunks -> BGE embeddings -> dense retrieval
   + BM25 lexical retrieval -> query/concept expansion -> query-aware fusion
   -> cross-encoder reranking -> policy-intent diversity/coverage rules
   -> cited evidence

Important:
RAG evidence supports a claims/rules engine. It should not independently make a
final medical/claims payment decision.
"""

from __future__ import annotations

import argparse
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Set, Tuple

import chromadb
from pypdf import PdfReader
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder, SentenceTransformer


PDF_PATH = os.getenv("PDF_PATH", "SYN-005-BRZ_Value_Health.pdf")
CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_db")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "insurance_policy")

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-large-en-v1.5")
RERANKER_MODEL = os.getenv("RERANKER_MODEL", "BAAI/bge-reranker-large")

DENSE_K = int(os.getenv("DENSE_K", "15"))
BM25_K = int(os.getenv("BM25_K", "15"))
RERANK_K = int(os.getenv("RERANK_K", "18"))
FINAL_K = int(os.getenv("FINAL_K", "6"))

TARGET_WORDS = int(os.getenv("TARGET_WORDS", "180"))
MAX_WORDS = int(os.getenv("MAX_WORDS", "260"))
OVERLAP_WORDS = int(os.getenv("OVERLAP_WORDS", "35"))


# ---------------------------------------------------------------------------
# Terminology normalization / semantic intent vocabulary
# ---------------------------------------------------------------------------

CONCEPT_TERMS: Dict[str, Tuple[str, ...]] = {
    "exclusion": (
        "exclusion",
        "exclusions",
        "excluded",
        "exclude",
        "not covered",
        "non covered",
        "non-covered",
        "not eligible",
        "not payable",
        "benefit exclusion",
        "plan exclusion",
        "coverage limitation",
        "limitation",
        "limitations",
        "not included",
        "does not cover",
        "won't cover",
        "will not cover",
        "ineligible",
    ),
    "authorization": (
        "prior authorization",
        "prior auth",
        "pre authorization",
        "pre-authorization",
        "preauth",
        "pre-auth",
        "pre approval",
        "pre-approval",
        "preapproval",
        "pre certification",
        "pre-certification",
        "precertification",
        "approval required",
        "authorization required",
        "requires approval",
        "requires authorization",
    ),
    "coverage": (
        "covered",
        "coverage",
        "benefit",
        "benefits",
        "pay for",
        "eligible for",
        "included",
    ),
    "cost": (
        "copay",
        "co-pay",
        "cost",
        "member cost",
        "deductible",
        "coinsurance",
        "out of pocket",
        "oop",
        "maximum",
        "price",
        "amount",
    ),
    "claim_rules": (
        "claim",
        "claims",
        "deadline",
        "timely filing",
        "submission window",
        "duplicate",
        "medical necessity",
    ),
}

CONCEPT_EXPANSIONS: Dict[str, str] = {
    "exclusion": (
        "coverage exclusions not covered non-covered excluded services "
        "benefit limitations services not payable plan exclusions"
    ),
    "authorization": (
        "prior authorization preauthorization pre approval preapproval "
        "pre-certification precertification authorization required approval required"
    ),
    "coverage": "covered coverage benefit eligible included payable",
    "cost": "copay deductible coinsurance member cost out of pocket maximum",
    "claim_rules": "claim submission deadline timely filing duplicate medical necessity",
}


def normalize(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def tokenize(text: str) -> List[str]:
    return re.findall(
        r"\$?\d[\d,]*(?:\.\d+)?%?|[A-Za-z]+(?:[-'][A-Za-z]+)*",
        text.lower(),
    )


def detect_concepts(text: str) -> Set[str]:
    q = text.lower()
    concepts = set()
    for concept, terms in CONCEPT_TERMS.items():
        if any(term in q for term in terms):
            concepts.add(concept)
    return concepts


def query_variants(query: str) -> List[str]:
    """
    Create a small, controlled query expansion set.

    We do not use a free-form LLM to rewrite the query because that can introduce
    facts not present in the user's request. The expansion is terminology-based.
    """
    concepts = detect_concepts(query)
    variants = [query]

    for concept in sorted(concepts):
        variants.append(f"{query} {CONCEPT_EXPANSIONS[concept]}")

    # High-value combined interpretation:
    if "exclusion" in concepts and "authorization" in concepts:
        variants.append(
            f"{query} excluded non-covered services prior authorization approval required"
        )

    return list(dict.fromkeys(variants))


# ---------------------------------------------------------------------------
# Structure-aware PDF parsing
# ---------------------------------------------------------------------------

def is_heading(line: str) -> bool:
    line = line.strip()
    if re.match(r"^\d+\.\s+.+", line):
        return True
    if re.match(r"^Appendix\s+[A-Z]\s*-\s*.+", line, re.I):
        return True
    return line in {
        "Purpose and Disclaimer",
        "Policy Identification",
    }


def clean_page_text(text: str) -> str:
    text = normalize(text)
    text = re.sub(
        r"Synthetic Policy \| SYN-005-BRZ \| Value Health\s*",
        "",
        text,
    )
    text = re.sub(r"\bPage\s+\d+\s*$", "", text, flags=re.MULTILINE)
    return text.strip()


def split_long_section(text: str) -> List[str]:
    words = text.split()
    if len(words) <= MAX_WORDS:
        return [text]

    chunks = []
    start = 0

    while start < len(words):
        end = min(start + TARGET_WORDS, len(words))
        piece = " ".join(words[start:end]).strip()
        if piece:
            chunks.append(piece)

        if end >= len(words):
            break

        start = max(end - OVERLAP_WORDS, start + 1)

    return chunks


@dataclass
class Chunk:
    id: str
    text: str
    page: int
    section: str
    chunk_type: str
    appendix: bool
    concepts: Set[str]


def extract_structure(pdf_path: str) -> List[Chunk]:
    reader = PdfReader(pdf_path)
    chunks: List[Chunk] = []

    for page_no, page in enumerate(reader.pages, start=1):
        text = clean_page_text(page.extract_text() or "")
        if not text:
            continue

        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        current_section = "Document Overview"
        blocks: List[Tuple[str, str]] = []
        current: List[str] = []

        for line in lines:
            if is_heading(line):
                if current:
                    blocks.append((current_section, "\n".join(current)))
                    current = []
                current_section = line
                current.append(line)
            else:
                current.append(line)

        if current:
            blocks.append((current_section, "\n".join(current)))

        for block_idx, (section, block) in enumerate(blocks):
            block = normalize(block)
            if not block:
                continue

            appendix = section.lower().startswith("appendix")
            chunk_type = "appendix_json" if appendix else "policy_section"

            for sub_idx, piece in enumerate(split_long_section(block)):
                concepts = detect_concepts(f"{section} {piece}")

                chunks.append(
                    Chunk(
                        id=f"p{page_no}_s{block_idx}_c{sub_idx}",
                        text=piece,
                        page=page_no,
                        section=section,
                        chunk_type=chunk_type,
                        appendix=appendix,
                        concepts=concepts,
                    )
                )

    return chunks


# ---------------------------------------------------------------------------
# Hybrid retrieval
# ---------------------------------------------------------------------------

class HybridRetriever:
    def __init__(self, chunks: List[Chunk]):
        self.chunks = chunks
        self.by_id = {c.id: c for c in chunks}

        print(f"Loading embedding model: {EMBEDDING_MODEL}")
        self.embedding_model = SentenceTransformer(EMBEDDING_MODEL)

        print(f"Loading reranker: {RERANKER_MODEL}")
        self.reranker = CrossEncoder(RERANKER_MODEL)

        self.bm25 = BM25Okapi([tokenize(c.text) for c in chunks])

        self.client = chromadb.PersistentClient(path=CHROMA_PATH)

        # Deterministic rebuild for the supplied policy document.
        try:
            self.client.delete_collection(COLLECTION_NAME)
        except Exception:
            pass

        self.collection = self.client.create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )

        self._index()

    def _index(self) -> None:
        documents = [c.text for c in self.chunks]

        metadatas = [
            {
                "page": c.page,
                "section": c.section,
                "chunk_type": c.chunk_type,
                "appendix": str(c.appendix).lower(),
                "concepts": ",".join(sorted(c.concepts)),
                "citation": (
                    f"[SYN-005-BRZ | PDF page {c.page} | {c.section}]"
                ),
            }
            for c in self.chunks
        ]

        embeddings = self.embedding_model.encode(
            documents,
            normalize_embeddings=True,
            show_progress_bar=True,
        ).tolist()

        self.collection.add(
            ids=[c.id for c in self.chunks],
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )

    @staticmethod
    def query_profile(query: str) -> Tuple[float, float]:
        """
        Return dense_weight, lexical_weight.

        Exact-value and rule questions benefit from BM25. Conceptual questions
        benefit more from semantic retrieval.
        """
        q = query.lower()
        concepts = detect_concepts(q)

        exact_markers = (
            "how much", "what is", "what's", "amount", "cost", "copay",
            "deductible", "maximum", "deadline", "days", "percent", "%",
            "coinsurance", "policy id", "effective date", "termination",
        )

        exact_hits = sum(marker in q for marker in exact_markers)

        if "exclusion" in concepts or "authorization" in concepts:
            # Terminology variations matter, but semantic meaning remains important.
            return 0.58, 0.42

        if exact_hits >= 2:
            return 0.42, 0.58
        if exact_hits == 1:
            return 0.55, 0.45
        return 0.70, 0.30

    def _dense_candidates(self, query: str) -> Dict[str, float]:
        variants = query_variants(query)
        scores: Dict[str, float] = {}

        for variant in variants:
            q_embedding = self.embedding_model.encode(
                [variant],
                normalize_embeddings=True,
            ).tolist()[0]

            result = self.collection.query(
                query_embeddings=[q_embedding],
                n_results=min(DENSE_K, len(self.chunks)),
                include=["documents", "metadatas", "distances"],
            )

            for cid, distance in zip(
                result["ids"][0],
                result["distances"][0],
            ):
                similarity = max(0.0, 1.0 - float(distance))
                # Original query gets full weight; expansion queries slightly less.
                variant_weight = 1.0 if variant == query else 0.88
                scores[cid] = max(
                    scores.get(cid, 0.0),
                    similarity * variant_weight,
                )

        return scores

    def _bm25_candidates(self, query: str) -> Dict[str, float]:
        variants = query_variants(query)
        scores: Dict[str, float] = {}

        for variant in variants:
            raw = self.bm25.get_scores(tokenize(variant))
            ranked = sorted(
                enumerate(raw),
                key=lambda x: x[1],
                reverse=True,
            )[:BM25_K]

            if not ranked:
                continue

            max_score = max(score for _, score in ranked) or 1.0

            for idx, score in ranked:
                normalized = float(score) / max_score
                variant_weight = 1.0 if variant == query else 0.88
                cid = self.chunks[idx].id
                scores[cid] = max(
                    scores.get(cid, 0.0),
                    normalized * variant_weight,
                )

        return scores

    def _concept_boost(self, query: str, chunk: Chunk) -> float:
        q_concepts = detect_concepts(query)
        if not q_concepts:
            return 1.0

        overlap = q_concepts.intersection(chunk.concepts)
        if not overlap:
            return 1.0

        # Strong but bounded boost. Retrieval still depends primarily on
        # dense/BM25 evidence and the cross-encoder.
        return min(1.18, 1.0 + 0.06 * len(overlap))

    def _intent_section_boost(self, query: str, chunk: Chunk) -> float:
        q = query.lower()
        section = chunk.section.lower()

        # A "not covered / exclusion" question should actively retrieve both:
        # 1) explicit exclusions
        # 2) benefit tables where a service is marked Covered = No.
        if "exclusion" in detect_concepts(query):
            if "exclusion" in section:
                return 1.18
            if "diagnostic" in section or "coverage" in section:
                return 1.08

        if "authorization" in detect_concepts(query):
            if "prior authorization" in section:
                return 1.18
            if "diagnostic" in section or "hospital" in section:
                return 1.08

        return 1.0

    def retrieve(self, query: str, final_k: int = FINAL_K) -> List[dict]:
        dense_weight, lexical_weight = self.query_profile(query)

        dense = self._dense_candidates(query)
        lexical = self._bm25_candidates(query)

        combined: Dict[str, float] = {}

        for cid in set(dense) | set(lexical):
            chunk = self.by_id[cid]

            base_score = (
                dense_weight * dense.get(cid, 0.0)
                + lexical_weight * lexical.get(cid, 0.0)
            )

            score = base_score
            score *= self._concept_boost(query, chunk)
            score *= self._intent_section_boost(query, chunk)

            # Appendix duplicates the policy and is useful for traceability,
            # but the human-readable policy tables are preferred.
            if chunk.appendix:
                score *= 0.90

            combined[cid] = score

        candidate_ids = [
            cid
            for cid, _ in sorted(
                combined.items(),
                key=lambda x: x[1],
                reverse=True,
            )[:max(RERANK_K, final_k)]
        ]

        candidates = [self.by_id[cid] for cid in candidate_ids]

        # Rerank using the original user wording. This prevents the expansion
        # vocabulary from changing the meaning of the actual question.
        rerank_scores = self.reranker.predict(
            [(query, c.text) for c in candidates]
        )

        ranked = sorted(
            zip(candidates, rerank_scores),
            key=lambda x: float(x[1]),
            reverse=True,
        )

        results = []
        seen_text: Set[str] = set()

        for chunk, rr_score in ranked:
            signature = " ".join(
                re.sub(
                    r"[^a-z0-9]+",
                    " ",
                    chunk.text.lower(),
                ).split()[:55]
            )

            if signature in seen_text:
                continue

            seen_text.add(signature)

            results.append(
                {
                    "id": chunk.id,
                    "text": chunk.text,
                    "page": chunk.page,
                    "section": chunk.section,
                    "concepts": sorted(chunk.concepts),
                    "citation": (
                        f"[SYN-005-BRZ | PDF page {chunk.page} | "
                        f"{chunk.section}]"
                    ),
                    "hybrid_score": combined[chunk.id],
                    "reranker_score": float(rr_score),
                }
            )

            if len(results) >= final_k:
                break

        return results


# ---------------------------------------------------------------------------
# Grounded evidence formatting
# ---------------------------------------------------------------------------

def format_grounded_answer(query: str, results: List[dict]) -> str:
    if not results:
        return (
            "No sufficiently relevant policy evidence was retrieved. "
            "Do not infer coverage, exclusion, or authorization requirements."
        )

    concepts = detect_concepts(query)

    lines = [
        f"Query: {query}",
        f"Detected policy concepts: {', '.join(sorted(concepts)) or 'general'}",
        "",
        "Retrieved policy evidence:",
    ]

    for index, result in enumerate(results, start=1):
        lines.extend(
            [
                "",
                f"{index}. {result['citation']}",
                f"   {result['text']}",
                f"   concepts={result['concepts']}",
                f"   reranker_score={result['reranker_score']:.4f}",
            ]
        )

    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", default=PDF_PATH)
    parser.add_argument("--query", help="Policy question")
    parser.add_argument("--top-k", type=int, default=FINAL_K)
    args = parser.parse_args()

    pdf = Path(args.pdf)
    if not pdf.exists():
        raise FileNotFoundError(f"PDF not found: {pdf}")

    chunks = extract_structure(str(pdf))
    print(f"Created {len(chunks)} structure-aware chunks.")

    retriever = HybridRetriever(chunks)

    if args.query:
        results = retriever.retrieve(args.query, final_k=args.top_k)
        print("\n" + format_grounded_answer(args.query, results))
    else:
        print(
            "Indexing complete. Example:\n"
            'python semantic_rag_policy.py --pdf SYN-005-BRZ_Value_Health.pdf '
            '--query "Which services are not covered?"'
        )


if __name__ == "__main__":
    main()
