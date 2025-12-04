from pydantic import BaseModel


class DepartmentBase(BaseModel):
    name: str


class DepartmentCreate(DepartmentBase):
    user_ids: list[int] = []


class DepartmentUpdate(DepartmentBase):
    user_ids: list[int] | None = None


class UserInDepartment(BaseModel):
    id: int
    username: str
    email: str
    role: str

    class Config:
        from_attributes = True


class DepartmentResponse(DepartmentBase):
    id: int
    users: list[UserInDepartment] = []

    class Config:
        from_attributes = True
