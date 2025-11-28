import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..schemas import department_schemas
from ..services import ds

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=list[department_schemas.DepartmentResponse])
async def get_all_departments(
    db: AsyncSession = Depends(get_db),
):
    try:
        return await ds.get_all_departments(db)
    except Exception as e:
        logger.error(f"Error getting all departments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error"
        )


@router.post(
    "/",
    response_model=department_schemas.DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_department(
    department: department_schemas.DepartmentCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await ds.create_department(db, department)
    except ValueError as e:
        logger.error(f"Value error creating department: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating department: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error"
        )


@router.put("/{department_id}", response_model=department_schemas.DepartmentResponse)
async def update_department(
    department_id: int,
    department: department_schemas.DepartmentUpdate,
    db: AsyncSession = Depends(get_db),
):
    try:
        updated = await ds.update_department(db, department_id, department)
        if updated is None:
            raise ValueError("Department not found")
        return updated
    except ValueError as e:
        logger.error(f"Value error updating department {department_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating department {department_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error"
        )


@router.delete("/{department_id}")
async def delete_department(
    department_id: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        deleted = await ds.delete_department(db, department_id)
        if deleted == 0:  # assuming it returns rows affected or similar
            raise ValueError("Department not found")
        return {"message": "Department deleted successfully"}
    except ValueError as e:
        logger.error(f"Value error deleting department {department_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting department {department_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error"
        )
