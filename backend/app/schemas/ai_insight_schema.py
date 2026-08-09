from pydantic import BaseModel
from typing import Optional

class AIInsightResponse(BaseModel):
    top_spending_day: Optional[str]
    top_category: Optional[str]
    overspending_detected: bool
    recommended_saving: float
    message: str
