from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ExpenseCreate(BaseModel):
    title: str
    amount: float = Field(..., gt=0)
    category: str
    description: Optional[str] = None
    date: datetime


class ExpenseResponse(BaseModel):
    id: str
    title: str
    amount: float
    category: str
    description: Optional[str]
    date: datetime