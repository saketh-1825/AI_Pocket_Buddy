from pydantic import BaseModel
from typing import List

class CalendarHeatmapItem(BaseModel):
    date: str
    amount: float
    intensity: int

class AnalyticsCalendarHeatmapResponse(BaseModel):
    heatmap: List[CalendarHeatmapItem]

class BudgetVsActualItem(BaseModel):
    category: str
    budget: float
    actual: float
    remaining: float
    percentage_used: float
    status: str

class AnalyticsBudgetVsActualResponse(BaseModel):
    has_budgets: bool
    items: List[BudgetVsActualItem]

class WordCloudItem(BaseModel):
    text: str
    value: int

class WeeklyComparisonResponse(BaseModel):
    this_week: float
    last_week: float
    percentage_change: float
    difference: float
    trend: str

class SpendingPatternResponse(BaseModel):
    most_active_day: str
    most_active_hour: int
    average_transaction: float
    favorite_category: str

class CategoryBudgetCreate(BaseModel):
    category: str
    monthly_budget: float
