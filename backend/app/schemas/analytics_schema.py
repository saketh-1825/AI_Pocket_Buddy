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

class TrendChartPoint(BaseModel):
    date: str
    current_period: float
    previous_period: float
    expense_count: int

class AnalyticsTrendsResponse(BaseModel):
    total_spent: float
    average_daily_spend: float
    week_over_week: float
    month_over_month: float
    trend_chart: List[TrendChartPoint]
    category_breakdown: List[CategorySummary]
