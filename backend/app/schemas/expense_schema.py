from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ExpenseCreate(BaseModel):
    title: str
    amount: float = Field(..., gt=0)
    category: str
    description: Optional[str] = None
    date: datetime


class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None


class ExpenseResponse(BaseModel):
    id: str
    title: str
    amount: float
    category: str
    description: Optional[str]
    date: datetime
    created_at: datetime