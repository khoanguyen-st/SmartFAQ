import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.users import get_current_user
from ..models.user import User
from ..schemas import department_schemas
from ..services import ams, ds

router = APIRouter()
logger = logging.getLogger(__name__)


def require_admin(current_user: User):
    """Check if user has admin role"""
    logger.info(f"Checking admin role for user: {current_user.email}, role: {current_user.role}")
    if current_user.role not in ("admin",):
        logger.warning(f"Access denied for user {current_user.email} with role {current_user.role}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource. Admin role required.",
        )
    return current_user


@router.get("/", response_model=list[department_schemas.DepartmentResponse])
async def get_all_departments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)
    try:
        return await ds.get_all_departments(db)
    except Exception as e:
        logger.error(f"Error getting all departments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error"
        )


@router.get("/users", response_model=list[department_schemas.UserInDepartment])
async def get_users_for_department(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get list of all users that can be assigned to departments (staff and admin only)"""
    require_admin(current_user)
    try:
        users = await ams.list_users(db, role=None)
        # Filter to only staff and admin users
        return [u for u in users if u.role in ("staff", "admin")]
    except Exception as e:
        logger.error(f"Error getting users for department assignment: {str(e)}")
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
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)
    try:
        return await ds.create_department(db, department)
    except HTTPException:
        raise
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
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)
    try:
        updated = await ds.update_department(db, department_id, department)
        if updated is None:
            raise ValueError("Department not found")
        return updated
    except HTTPException:
        raise
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
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)
    try:
        deleted = await ds.delete_department(db, department_id)
        if deleted == 0:
            raise ValueError("Department not found")
        return {"message": "Department deleted successfully"}
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Value error deleting department {department_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting department {department_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error"
        )
