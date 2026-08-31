"""Document management service for claim attachments."""
from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, status

from repositories.file_repository import FileRepository
from schemas.document_schemas import DocumentEntry, DocumentListResponse, DocumentUploadResponse
from utils.file_utils import validate_extension, validate_size

logger = logging.getLogger(__name__)
MAX_DOCUMENTS_PER_CLAIM = 5
DOCUMENT_TAGS = {'PolicyDocument', 'ProviderContractAgreement', 'InsuranceID', 'MISC'}


class DocumentService:
    def __init__(self, db: object, files: FileRepository) -> None:
        self._db = db
        self._files = files

    def upload(
        self,
        claim_id: str,
        filename: str,
        content: bytes,
        document_tag: str,
        user_id: int,
    ) -> DocumentUploadResponse:
        extension = validate_extension(filename)
        validate_size(len(content))
        if document_tag not in DOCUMENT_TAGS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f'Unsupported document tag: {document_tag}',
            )

        existing = self.list_documents(claim_id).documents
        if len(existing) >= MAX_DOCUMENTS_PER_CLAIM:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail='Maximum 5 documents per claim',
            )

        file_path = self._files.save(claim_id, content, filename)
        try:
            rows = self._db.execute_sp(
                'sp_AttachDocument',
                (claim_id, filename, file_path, extension.lstrip('.'), document_tag, len(content), user_id),
            )
        except Exception as exc:
            self._files.delete(file_path)
            if 'Maximum 5 documents' in str(exc):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail='Maximum 5 documents per claim',
                ) from exc
            logger.error('DB error uploading document: %s', type(exc).__name__)
            raise RuntimeError('Database error') from exc

        document_id = int(rows[0].get('DocumentId', 0)) if rows else 0
        return DocumentUploadResponse(
            document_id=document_id,
            file_name=filename,
            file_size=len(content),
            document_tag=document_tag,
        )

    def list_documents(self, claim_id: str) -> DocumentListResponse:
        try:
            rows = self._db.execute_sp('sp_GetDocuments', (claim_id,))
        except Exception as exc:
            logger.error('DB error listing documents: %s', type(exc).__name__)
            raise RuntimeError('Database error') from exc

        documents = [self._to_document_entry(row) for row in rows]
        return DocumentListResponse(documents=documents)

    def get_document(self, claim_id: str, doc_id: int) -> tuple[str, str]:
        row = self._get_document_row(claim_id, doc_id)
        file_path = str(row.get('FilePath', ''))
        if not file_path or not self._files.exists(file_path):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Document not found')
        return file_path, str(row.get('FileName', 'document'))

    def delete(self, claim_id: str, doc_id: int, _username: str) -> None:
        row = self._get_document_row(claim_id, doc_id)
        try:
            self._db.execute_sp_no_result('sp_DeleteDocument', (doc_id, claim_id))
        except Exception as exc:
            logger.error('DB error deleting document: %s', type(exc).__name__)
            raise RuntimeError('Database error') from exc
        self._files.delete(str(row.get('FilePath', '')))

    def _get_document_row(self, claim_id: str, doc_id: int) -> dict[str, Any]:
        try:
            rows = self._db.execute_sp('sp_GetDocumentById', (doc_id, claim_id))
        except Exception as exc:
            logger.error('DB error fetching document: %s', type(exc).__name__)
            raise RuntimeError('Database error') from exc
        if not rows:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Document not found')
        return rows[0]

    @staticmethod
    def _to_document_entry(row: dict[str, Any]) -> DocumentEntry:
        return DocumentEntry(
            document_id=int(row.get('DocumentId', 0)),
            file_name=str(row.get('FileName', '')),
            file_type=str(row.get('FileType', '')).lower(),
            document_tag=str(row.get('DocumentTag', 'MISC')),
            file_size_bytes=int(row.get('FileSizeBytes', 0)),
            uploaded_on=row.get('UploadedOn'),
        )
