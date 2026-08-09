from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

# Legacy Overall Budget schemas for backward compatibility
class LegacyBudgetUpdate(BaseModel):
    monthly_budget: float = Field(..., gt=0)

class LegacyBudgetResponse(BaseModel):
    id: str
    user_id: str
    monthly_budget: float
    month: int
    year: int
    created_at: datetime
    updated_at: datetime

class LegacyBudgetCheckResponse(BaseModel):
    exists: bool
    monthly_budget: Optional[float] = None
    month: int
    year: int

# New Category-specific Budget schemas
class BudgetCreate(BaseModel):
    category: str
    month: int
    year: int
    limit_amount: float = Field(..., gt=0)

class BudgetUpdate(BaseModel):
    limit_amount: Optional[float] = Field(None, gt=0)
    # Legacy support
    monthly_budget: Optional[float] = Field(None, gt=0)

class BudgetResponse(BaseModel):
    id: str
    category: str
    month: int
    year: int
    limit_amount: float
    spent_amount: float
    remaining_amount: float
    progress_percentage: float
    status: str

class BudgetAlertItem(BaseModel):
    category: str
    used_percentage: float
    remaining: float
    status: str

class BudgetAlertsResponse(BaseModel):
    warning: List[BudgetResponse]
    over: List[BudgetResponse]
    safe: List[BudgetResponse]
