"""Document management endpoints (clean version)."""

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..api import schemas
from ..core.db import get_session

router = APIRouter()


# Mock data for development
MOCK_DOCUMENTS = [
    {
        "id": 1,
        "title": "Hướng dẫn đăng ký môn học.pdf",
        "category": "Academic",
        "tags": "registration,enrollment",
        "language": "vi",
        "status": "ACTIVE",
        "file_size": 245678,
        "created_at": "2024-11-01T10:30:00Z",
        "updated_at": "2024-11-01T10:30:00Z",
        "current_version_id": 1,
        "versions": [
            {
                "id": 1,
                "version_number": 1,
                "file_path": "/uploads/course_registration_guide.pdf",
                "created_at": "2024-11-01T10:30:00Z",
            }
        ],
    },
    {
        "id": 2,
        "title": "Tuition Fee Policy 2024.pdf",
        "category": "Finance",
        "tags": "tuition,payment,fees",
        "language": "en",
        "status": "ACTIVE",
        "file_size": 189234,
        "created_at": "2024-10-15T14:20:00Z",
        "updated_at": "2024-10-20T09:15:00Z",
        "current_version_id": 2,
        "versions": [
            {
                "id": 1,
                "version_number": 1,
                "file_path": "/uploads/tuition_policy_v1.pdf",
                "created_at": "2024-10-15T14:20:00Z",
            },
            {
                "id": 2,
                "version_number": 2,
                "file_path": "/uploads/tuition_policy_v2.pdf",
                "created_at": "2024-10-20T09:15:00Z",
            },
        ],
    },
    {
        "id": 3,
        "title": "Quy định ký túc xá.pdf",
        "category": "Student Life",
        "tags": "dormitory,accommodation",
        "language": "vi",
        "status": "ACTIVE",
        "file_size": 312456,
        "created_at": "2024-09-10T08:00:00Z",
        "updated_at": "2024-09-10T08:00:00Z",
        "current_version_id": 3,
        "versions": [
            {
                "id": 3,
                "version_number": 1,
                "file_path": "/uploads/dormitory_rules.pdf",
                "created_at": "2024-09-10T08:00:00Z",
            }
        ],
    },
    {
        "id": 4,
        "title": "Library Services Guide.pdf",
        "category": "Library",
        "tags": "library,services,resources",
        "language": "en",
        "status": "ACTIVE",
        "file_size": 567890,
        "created_at": "2024-08-25T11:45:00Z",
        "updated_at": "2024-08-25T11:45:00Z",
        "current_version_id": 4,
        "versions": [
            {
                "id": 4,
                "version_number": 1,
                "file_path": "/uploads/library_guide.pdf",
                "created_at": "2024-08-25T11:45:00Z",
            }
        ],
    },
    {
        "id": 5,
        "title": "Scholarship Application Form.pdf",
        "category": "Financial Aid",
        "tags": "scholarship,application,funding",
        "language": "en",
        "status": "ACTIVE",
        "file_size": 123456,
        "created_at": "2024-11-10T16:30:00Z",
        "updated_at": "2024-11-12T10:00:00Z",
        "current_version_id": 5,
        "versions": [
            {
                "id": 5,
                "version_number": 1,
                "file_path": "/uploads/scholarship_form.pdf",
                "created_at": "2024-11-10T16:30:00Z",
            }
        ],
    },
]


@router.get("/")
def list_docs(db: Session = Depends(get_session)):
    return {"items": MOCK_DOCUMENTS}


@router.post("/")
async def create_docs(
    files: list[UploadFile] | None = None,
    title: str | None = Form(None),
    category: str | None = Form(None),
    tags: str | None = Form(None),
    language: str = Form("en"),
    status: str = Form("ACTIVE"),
    db: Session = Depends(get_session),
):
    # Mock upload - just return success
    if files:
        results = [
            {
                "id": len(MOCK_DOCUMENTS) + i + 1,
                "title": file.filename,
                "status": "accepted",
            }
            for i, file in enumerate(files)
        ]
        return {"status": "accepted", "items": results}

    # Metadata only
    if not title:
        raise HTTPException(400, "title is required")

    new_doc = {
        "id": len(MOCK_DOCUMENTS) + 1,
        "title": title,
        "category": category,
        "tags": tags,
        "language": language,
        "status": status,
    }
    return {"item": new_doc}


@router.get("/{doc_id}")
def get_document(doc_id: int, db: Session = Depends(get_session)):
    doc = next((d for d in MOCK_DOCUMENTS if d["id"] == doc_id), None)
    if not doc:
        raise HTTPException(404, "Document not found")
    return doc


@router.get("/{doc_id}/download")
def download_document(doc_id: int, db: Session = Depends(get_session)):
    # Mock - just return error for now
    raise HTTPException(404, "Download not available in mock mode")


@router.put("/{doc_id}")
def update_document(
    doc_id: int, payload: schemas.DocumentUpdate, db: Session = Depends(get_session)
):
    doc = next((d for d in MOCK_DOCUMENTS if d["id"] == doc_id), None)
    if not doc:
        raise HTTPException(404, "Document not found")
    return {"status": "ok"}


@router.delete("/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_session)):
    doc = next((d for d in MOCK_DOCUMENTS if d["id"] == doc_id), None)
    if not doc:
        raise HTTPException(404, "Document not found")
    return {"status": "deleted"}
