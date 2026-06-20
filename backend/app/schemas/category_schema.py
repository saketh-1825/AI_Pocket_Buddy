from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=25)
    color: str
    icon: str


class CategoryResponse(BaseModel):
    id: str
    name: str
    color: str
    icon: str