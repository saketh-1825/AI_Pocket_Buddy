from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=25)
    color: str
    icon_key: str

class CategoryResponse(BaseModel):
    id: str
    name: str
    icon_key: str
    color: str
    is_default: bool
    ai_group: str
    display_order: int
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None