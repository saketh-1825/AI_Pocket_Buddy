from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    color: str


class CategoryResponse(BaseModel):
    id: str
    name: str
    color: str