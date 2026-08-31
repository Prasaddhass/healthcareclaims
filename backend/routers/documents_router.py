"""Document upload, listing, download, and delete endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from dependencies import get_current_user, get_db
from repositories.db_repository import DBRepository
from repositories.file_repository import FileRepository
from schemas.auth_schemas import UserSchema
from schemas.document_schemas import DocumentListResponse, DocumentUploadResponse
from services.document_service import DocumentService

router = APIRouter(dependencies=[Depends(get_current_user)])


def _get_service(db: DBRepository = Depends(get_db)) -> DocumentService:
    return DocumentService(db, FileRepository())


@router.get('/{claim_id}/documents', response_model=DocumentListResponse, summary='List claim documents')
def list_documents(claim_id: str, service: DocumentService = Depends(_get_service)) -> DocumentListResponse:
    try:
        return service.list_documents(claim_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Database error') from exc


@router.post(
    '/{claim_id}/documents',
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary='Upload a claim document',
)
async def upload_document(
    claim_id: str,
    file: UploadFile = File(...),
    document_tag: str = Form('MISC'),
    current_user: UserSchema = Depends(get_current_user),
    service: DocumentService = Depends(_get_service),
) -> DocumentUploadResponse:
    try:
        content = await file.read()
        return service.upload(
            claim_id=claim_id,
            filename=file.filename or 'document',
            content=content,
            document_tag=document_tag,
            user_id=current_user.user_id,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Database error') from exc


@router.get('/{claim_id}/documents/{doc_id}/download', summary='Download a claim document')
def download_document(claim_id: str, doc_id: int, service: DocumentService = Depends(_get_service)) -> FileResponse:
    try:
        file_path, filename = service.get_document(claim_id, doc_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Database error') from exc
    return FileResponse(path=file_path, filename=filename, media_type='application/octet-stream')


@router.delete('/{claim_id}/documents/{doc_id}', status_code=status.HTTP_204_NO_CONTENT, summary='Delete a claim document')
def delete_document(
    claim_id: str,
    doc_id: int,
    current_user: UserSchema = Depends(get_current_user),
    service: DocumentService = Depends(_get_service),
) -> None:
    try:
        service.delete(claim_id, doc_id, current_user.username)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Database error') from exc
