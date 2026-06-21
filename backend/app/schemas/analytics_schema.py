from pydantic import BaseModel
from typing import List, Optional

class MonthlySummary(BaseModel):
    year: int
    month: int
    month_name: str
    total_spent: float
    expense_count: int
    average_expense: float
    budget: Optional[float] = None
    budget_usage_percentage: Optional[float] = None
    is_current_month: bool = False

class CategorySummary(BaseModel):
    category: str
    total: float
    percentage: float

class TopCategory(BaseModel):
    category: str
    amount: float
    percentage: float

class HighestMonth(BaseModel):
    month: str
    year: int
    amount: float

class AnalyticsSummaryResponse(BaseModel):
    monthly_summary: List[MonthlySummary]
    category_breakdown: List[CategorySummary]
    total_spent: float
    expense_count: int
    average_expense: float
    top_category: Optional[TopCategory]
    highest_month: Optional[HighestMonth]
    monthly_change_percentage: float
    savings_rate: float
