"""Department service."""

import logging

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload

from ..models.department import Department
from ..models.user import User
from ..models.user_department import UserDepartment
from ..schemas.department_schemas import DepartmentCreate, DepartmentUpdate

logger = logging.getLogger(__name__)


async def get_all_departments(db: AsyncSession) -> list[Department]:
    result = await db.execute(
        select(Department).options(joinedload(Department.documents), joinedload(Department.users))
    )
    return result.unique().scalars().all()


async def create_department(db: AsyncSession, department: DepartmentCreate) -> Department:
    logger.info(
        f"Creating department with name: {department.name}, user_ids: {department.user_ids}"
    )

    existing_department = await db.execute(
        select(Department).where(Department.name == department.name)
    )
    if existing_department.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Department name already exists"
        )

    new_department = Department(name=department.name)
    db.add(new_department)
    await db.flush()
    logger.info(f"Department created with ID: {new_department.id}")

    # Assign users to department
    if department.user_ids:
        logger.info(f"Assigning users: {department.user_ids}")
        # Verify all users exist
        user_result = await db.execute(select(User).where(User.id.in_(department.user_ids)))
        users = user_result.scalars().all()
        logger.info(f"Found {len(users)} users out of {len(department.user_ids)} requested")

        if len(users) != len(department.user_ids):
            found_ids = [u.id for u in users]
            missing_ids = [uid for uid in department.user_ids if uid not in found_ids]
            logger.error(f"Missing user IDs: {missing_ids}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"One or more user IDs are invalid: {missing_ids}",
            )

        # Manually create UserDepartment associations
        for user in users:
            user_dept = UserDepartment(user_id=user.id, department_id=new_department.id)
            db.add(user_dept)

        logger.info(f"Successfully assigned {len(users)} users to department")

    await db.commit()
    await db.refresh(new_department)

    # Reload with relationships
    result = await db.execute(
        select(Department)
        .options(joinedload(Department.users))
        .where(Department.id == new_department.id)
    )
    new_department = result.unique().scalar_one()

    logger.info(f"Department creation completed. Department has {len(new_department.users)} users")
    return new_department


async def get_department(db: AsyncSession, department_id: int) -> Department:
    result = await db.execute(
        select(Department)
        .options(joinedload(Department.documents), joinedload(Department.users))
        .where(Department.id == department_id)
    )
    department = result.unique().scalar_one_or_none()
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

    # Update user assignments if provided
    if department.user_ids is not None:
        if department.user_ids:
            # Verify all users exist
            user_result = await db.execute(select(User).where(User.id.in_(department.user_ids)))
            users = user_result.scalars().all()
            if len(users) != len(department.user_ids):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="One or more user IDs are invalid",
                )

            # Remove existing associations
            await db.execute(
                select(UserDepartment).where(UserDepartment.department_id == department_id)
            )
            await db.execute(
                UserDepartment.__table__.delete().where(
                    UserDepartment.department_id == department_id
                )
            )

            # Add new associations
            for user in users:
                user_dept = UserDepartment(user_id=user.id, department_id=department_id)
                db.add(user_dept)
        else:
            # Clear all user assignments
            await db.execute(
                UserDepartment.__table__.delete().where(
                    UserDepartment.department_id == department_id
                )
            )

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Department)
        .options(joinedload(Department.users))
        .where(Department.id == department_id)
    )
    existing_department = result.unique().scalar_one()

    return existing_department


async def delete_department(db: AsyncSession, department_id: int):
    existing_department = await get_department(db, department_id)
    await db.delete(existing_department)
    await db.commit()
