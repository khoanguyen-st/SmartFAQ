"""Department service."""

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload

from ..models.department import Department
from ..schemas.department_schemas import DepartmentCreate, DepartmentUpdate


async def get_all_departments(db: AsyncSession) -> list[Department]:
    result = await db.execute(select(Department).options(joinedload(Department.documents)))
    return result.scalars().all()


async def create_department(db: AsyncSession, department: DepartmentCreate) -> Department:
    existing_department = await db.execute(
        select(Department).where(Department.name == department.name)
    )
    if existing_department.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Department name already exists"
        )

    new_department = Department(name=department.name)
    db.add(new_department)
    await db.commit()
    await db.refresh(new_department)
    return new_department


async def get_department(db: AsyncSession, department_id: int) -> Department:
    result = await db.execute(
        select(Department)
        .options(joinedload(Department.documents))
        .where(Department.id == department_id)
    )
    department = result.scalar_one_or_none()
    if not department:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
    return department


async def update_department(
    db: AsyncSession, department_id: int, department: DepartmentUpdate
) -> Department:
    result = await db.execute(
        select(Department).where(Department.name == department.name, Department.id != department_id)
    )
    duplicate = result.scalar_one_or_none()
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Department name already exists"
        )

    existing_department = await get_department(db, department_id)
    existing_department.name = department.name
    await db.commit()
    await db.refresh(existing_department)
    return existing_department


async def delete_department(db: AsyncSession, department_id: int):
    existing_department = await get_department(db, department_id)
    await db.delete(existing_department)
    await db.commit()
