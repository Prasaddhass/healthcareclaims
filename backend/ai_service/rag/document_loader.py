"""Utilities for loading source documents into the RAG pipeline."""
from __future__ import annotations

import argparse
import csv
from pathlib import Path

from PyPDF2 import PdfReader
from langchain_core.documents import Document


class DocumentLoader:
    def load_pdf(self, path: str) -> list[Document]:
        reader = PdfReader(path)
        source = Path(path)
        docs: list[Document] = []
        for page_number, page in enumerate(reader.pages, start=1):
            text = (page.extract_text() or '').strip()
            if text:
                docs.append(Document(page_content=text, metadata={'source': source.name, 'file_path': str(source), 'page': page_number}))
        return docs

    def load_csv(self, path: str) -> list[Document]:
        source = Path(path)
        docs: list[Document] = []
        with source.open('r', encoding='utf-8', newline='') as handle:
            reader = csv.DictReader(handle)
            for row_number, row in enumerate(reader, start=1):
                text = ' | '.join(f'{key}: {value}' for key, value in row.items() if value)
                if text:
                    docs.append(Document(page_content=text, metadata={'source': source.name, 'file_path': str(source), 'row': row_number}))
        return docs

    def load_directory(self, dir_path: str) -> list[Document]:
        docs: list[Document] = []
        for path in sorted(Path(dir_path).iterdir()):
            if path.suffix.lower() == '.pdf':
                docs.extend(self.load_pdf(str(path)))
            elif path.suffix.lower() == '.csv':
                docs.extend(self.load_csv(str(path)))
        return docs


def _run_cli() -> None:
    parser = argparse.ArgumentParser(description='Ingest knowledge documents into the RAG store')
    parser.add_argument('--ingest', required=True, help='Path to a PDF, CSV, or directory to ingest')
    args = parser.parse_args()

    loader = DocumentLoader()
    path = Path(args.ingest)
    if path.is_dir():
        documents = loader.load_directory(str(path))
    elif path.suffix.lower() == '.pdf':
        documents = loader.load_pdf(str(path))
    elif path.suffix.lower() == '.csv':
        documents = loader.load_csv(str(path))
    else:
        raise ValueError(f'Unsupported file type: {path.suffix}')

    from ai_service.rag.rag_engine import RAGEngine

    RAGEngine().ingest(documents)
    print(f'Ingested {len(documents)} document chunks')


if __name__ == '__main__':
    _run_cli()
