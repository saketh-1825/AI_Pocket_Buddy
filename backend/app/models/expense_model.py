from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str
    date: datetime

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[datetime] = None

class ExpenseResponse(BaseModel):
    id: str
    title: str
    amount: float
    category: str
    date: datetime