from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock, patch

from langchain_core.documents import Document

from ai_service.config import AISettings
from ai_service.rag.document_loader import DocumentLoader
from ai_service.rag.rag_engine import RAGEngine


def test_load_pdf_returns_documents() -> None:
    page = MagicMock()
    page.extract_text.return_value = '13. Exclusions\n99213 is not covered.'
    reader = MagicMock()
    reader.pages = [page]
    with patch('ai_service.rag.document_loader.PdfReader', return_value=reader):
        docs = DocumentLoader().load_pdf('sample.pdf')
    assert len(docs) == 1
    assert docs[0].metadata['section'] == '13. Exclusions'
    assert docs[0].page_content == '13. Exclusions\n99213 is not covered.'


def test_load_csv_returns_row_documents() -> None:
    file_path = Path(__file__).with_name('sample.csv')
    file_path.write_text('code,description\n99213,Office visit\n', encoding='utf-8')
    try:
        docs = DocumentLoader().load_csv(str(file_path))
    finally:
        file_path.unlink(missing_ok=True)
    assert len(docs) == 1
    assert '99213' in docs[0].page_content


def test_load_directory_aggregates_supported_files() -> None:
    directory = Path(__file__).with_name('loader-dir')
    directory.mkdir(parents=True, exist_ok=True)
    (directory / 'codes.csv').write_text('code\nA1234\n', encoding='utf-8')
    try:
        loader = DocumentLoader()
        with patch.object(loader, 'load_pdf', return_value=[Document(page_content='pdf', metadata={})]):
            docs = loader.load_directory(str(directory))
    finally:
        for child in directory.iterdir():
            child.unlink(missing_ok=True)
        directory.rmdir()
    assert len(docs) >= 1


def test_rag_engine_ingest_splits_and_persists() -> None:
    vector_store = MagicMock()
    docs = [Document(page_content='Example text', metadata={'source': 'a.txt'})]
    settings = AISettings(OPENAI_API_KEY='key')
    with patch('ai_service.rag.rag_engine.get_embeddings', return_value=MagicMock()), patch('ai_service.rag.rag_engine.RecursiveCharacterTextSplitter') as splitter_cls:
        splitter_cls.return_value.split_documents.return_value = docs
        ingested = RAGEngine(settings=settings, vector_store=vector_store).ingest(docs)
    assert ingested == 1
    vector_store.add_documents.assert_called_once_with(docs)


def test_rag_engine_retrieve_returns_payload() -> None:
    document = Document(
        page_content='policy text',
        metadata={'source': 'policy.pdf', 'page': 3, 'section': '13. Exclusions'},
    )
    vector_store = MagicMock()
    vector_store.similarity_search_with_relevance_scores.return_value = [(document, 0.88)]
    settings = AISettings(OPENAI_API_KEY='key')
    with patch('ai_service.rag.rag_engine.get_embeddings', return_value=MagicMock()):
        results = RAGEngine(settings=settings, vector_store=vector_store).retrieve(
            'policy',
            top_k=2,
            metadata_filter={'claim_id': 'claim-123'},
        )
    assert results[0]['source'] == 'policy.pdf'
    assert results[0]['relevance'] == 0.88
    assert results[0]['section'] == '13. Exclusions'
    assert results[0]['page'] == 3
    vector_store.similarity_search_with_relevance_scores.assert_called_once_with(
        'policy',
        k=2,
        filter={'claim_id': 'claim-123'},
    )
