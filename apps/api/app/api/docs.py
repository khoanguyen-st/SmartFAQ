import io
import logging
import os

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from ..core.database import get_db
from ..core.users import get_current_user
from ..models import document as document_model
from ..models.user import User
from ..schemas import document
from ..services import dms

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", dependencies=[Depends(get_current_user)])
async def list_docs(db: AsyncSession = Depends(get_db)):
    try:
        items = await dms.list_documents(db)
        return {"items": items}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to list documents")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list documents.",
        ) from exc


@router.post("/")
async def create_docs(
    files: list[UploadFile] | None = None,
    title: str | None = Form(None),
    category: str | None = Form(None),
    tags: str | None = Form(None),
    department_id: int | None = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        # Get department_id from user if not provided
        final_department_id = department_id
        if final_department_id is None:
            # Refresh user with departments relationship
            await db.refresh(current_user, ["departments"])
            if current_user.departments:
                final_department_id = current_user.departments[0].id
                logger.info(
                    "Auto-assigned department_id %s for user %s",
                    final_department_id,
                    current_user.id,
                )

        if files:
            results = await dms.enqueue_multiple_documents(
                files, current_user.id, final_department_id
            )
            return {"status": "accepted", "items": results}

        if not title:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="title is required")

        payload = document.DocumentCreate(title=title, category=category, tags=tags, language="vi")

        data = payload.dict()
        data["creator_id"] = current_user.id
        data["department_id"] = final_department_id
        result = await dms.create_metadata_document(data, db)
        return {"item": result, "status": status.HTTP_201_CREATED}

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to create document(s)")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create document(s).",
        ) from exc


@router.get("/search")
async def search_documents_by_name(name: str, db: AsyncSession = Depends(get_db)):
    try:
        docs = await dms.search_documents_by_name(name, db)
        return {"documents": docs}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to search documents by name")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search documents by name.",
        ) from exc


@router.get("/filter")
async def filter_documents_by_format(format: str, db: AsyncSession = Depends(get_db)):
    try:
        docs = await dms.filter_documents_by_format(format, db)
        return {"documents": docs}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to filter documents by format")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to filter documents by format.",
        ) from exc


@router.get("/{doc_id}", response_model=document.DocumentOut)
async def get_document(doc_id: int, db: AsyncSession = Depends(get_db)):
    try:
        doc = await dms.get_document(doc_id, db)
        if not doc:
            raise HTTPException(404, "Document not found")
        return doc
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to fetch document %s", doc_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch document.",
        ) from exc


@router.get("/{doc_id}/download")
async def download_document(doc_id: int, db: AsyncSession = Depends(get_db)):
    try:
        doc = await dms.get_document(doc_id, db)
        if not doc:
            raise HTTPException(404, "Document not found")

        # Get file path directly from document
        object_name = doc.get("versions", [{}])[0].get("file_path") if doc.get("versions") else None

        if not object_name:
            raise HTTPException(404, "File not found in storage")

        response = dms.minio_client.get_object(dms.BUCKET_NAME, object_name)
        content = response.read()
        filename = os.path.basename(object_name)

        # Encode filename for Content-Disposition header to support non-ASCII characters
        from urllib.parse import quote

        encoded_filename = quote(filename)

        return StreamingResponse(
            io.BytesIO(content),
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"},
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to download document %s", doc_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download document.",
        ) from exc


@router.put("/{doc_id}")
async def update_document(
    doc_id: int,
    file: UploadFile | None = File(None),
    title: str | None = Form(None),
    category: str | None = Form(None),
    tags: str | None = Form(None),
    language: str | None = Form(None),
    department_id: int | None = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        # Get department_id from user if not provided
        final_department_id = department_id
        if final_department_id is None:
            await db.refresh(current_user, ["departments"])
            if current_user.departments:
                final_department_id = current_user.departments[0].id
                logger.info(
                    "Auto-assigned department_id %s for user %s",
                    final_department_id,
                    current_user.id,
                )

        result = await dms.update_document(
            doc_id=doc_id,
            db=db,
            file=file,
            title=title,
            category=category,
            tags=tags,
            language=language,
            department_id=final_department_id,
            current_user_id=current_user.id,
        )

        if not result:
            raise HTTPException(404, "Document not found")

        return {"status": "updated", "item": result}

    except dms.UploadTooLarge as exc:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=str(exc),
        ) from exc
    except dms.InvalidFileType as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to update document %s", doc_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update document.",
        ) from exc


@router.delete("/{doc_id}")
async def delete_document(doc_id: int, db: AsyncSession = Depends(get_db)):
    try:
        ok = await dms.delete_document(doc_id, db)
        if not ok:
            raise HTTPException(404, "Document not found")
        return {"status": "deleted"}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to delete document %s", doc_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document.",
        ) from exc


@router.get("/documents/status")
async def get_documents_by_status(
    document_status: str | None = None, db: AsyncSession = Depends(get_db)
):
    try:
        stmt = select(document_model.Document)
        if document_status:
            stmt = stmt.where(document_model.Document.status == document_status)

        result = await db.execute(stmt)
        docs = result.scalars().all()

        return {
            "documents": [
                {
                    "document_id": doc.id,
                    "title": doc.title,
                    "status": doc.status,
                    "version_no": doc.version_no,
                }
                for doc in docs
            ]
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to fetch documents by status")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch documents by status.",
        ) from exc
