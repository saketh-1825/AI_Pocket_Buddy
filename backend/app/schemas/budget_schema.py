from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class BudgetUpdate(BaseModel):
    monthly_budget: float = Field(..., gt=0)

class BudgetResponse(BaseModel):
    id: str
    user_id: str
    monthly_budget: float
    month: int
    year: int
    created_at: datetime
    updated_at: datetime

class BudgetCheckResponse(BaseModel):
    exists: bool
    monthly_budget: Optional[float] = None
    month: int
    year: int

