from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class BudgetModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    category: str
    month: int
    year: int
    limit_amount: float
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
