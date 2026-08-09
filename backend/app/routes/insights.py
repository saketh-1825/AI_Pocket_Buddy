from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timezone
from app.utils.auth import get_current_user
from app.database import db
from app.schemas.insight_schema import (
    AnalyticsCalendarHeatmapResponse,
    AnalyticsBudgetVsActualResponse,
    WordCloudItem,
    WeeklyComparisonResponse,
    SpendingPatternResponse,
    CategoryBudgetCreate
)
from app.schemas.ai_insight_schema import AIInsightResponse
from app.services.insight_service import InsightService
from app.services.ai_insight_service import AIInsightService

router = APIRouter(prefix="/insights", tags=["insights"])

@router.get("/calendar-heatmap", response_model=AnalyticsCalendarHeatmapResponse)
async def get_calendar_heatmap(current_user: dict = Depends(get_current_user)):
    try:
        user_id = str(current_user["_id"])
        heatmap = await InsightService.get_calendar_heatmap(user_id)
        return {"heatmap": heatmap}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Calendar heatmap calculation failure: {str(e)}"
        )

@router.get("/budget-vs-actual", response_model=AnalyticsBudgetVsActualResponse)
async def get_budget_vs_actual(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        user_id = str(current_user["_id"])
        if month is None or year is None:
            now = datetime.now(timezone.utc)
            month = month or now.month
            year = year or now.year
        items = await InsightService.get_budget_vs_actual(user_id, month, year)
        return {
            "has_budgets": len(items) > 0,
            "items": items
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Budget vs actual calculation failure: {str(e)}"
        )

@router.post("/budget")
async def set_category_budget(
    data: CategoryBudgetCreate,
    current_user: dict = Depends(get_current_user)
):
    try:
        user_id = str(current_user["_id"])
        category = data.category
        monthly_budget = data.monthly_budget
        now = datetime.now(timezone.utc)
        
        existing = await db["budgets"].find_one({
            "user_id": user_id,
            "category": category,
            "is_archived": {"$ne": True}
        })
        
        if existing:
            await db["budgets"].update_one(
                {"_id": existing["_id"]},
                {
                    "$set": {
                        "monthly_budget": monthly_budget,
                        "month": existing.get("month") or now.month,
                        "year": existing.get("year") or now.year,
                        "is_active": True,
                        "updated_at": now
                    }
                }
            )
        else:
            new_budget = {
                "user_id": user_id,
                "category": category,
                "monthly_budget": monthly_budget,
                "month": now.month,
                "year": now.year,
                "is_active": True,
                "created_at": now,
                "updated_at": now
            }
            await db["budgets"].insert_one(new_budget)
            
        return {
            "message": "Category budget set",
            "category": category,
            "monthly_budget": monthly_budget
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set category budget: {str(e)}"
        )

@router.get("/word-cloud", response_model=List[WordCloudItem])
async def get_word_cloud(current_user: dict = Depends(get_current_user)):
    try:
        user_id = str(current_user["_id"])
        word_freq = await InsightService.get_word_cloud(user_id)
        return word_freq
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Word frequency calculation failure: {str(e)}"
        )

@router.get("/weekly-comparison", response_model=WeeklyComparisonResponse)
async def get_weekly_comparison(current_user: dict = Depends(get_current_user)):
    try:
        user_id = str(current_user["_id"])
        comparison = await InsightService.get_weekly_comparison(user_id)
        return comparison
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Weekly comparison calculation failure: {str(e)}"
        )

@router.get("/spending-pattern", response_model=SpendingPatternResponse)
async def get_spending_pattern(current_user: dict = Depends(get_current_user)):
    try:
        user_id = str(current_user["_id"])
        pattern = await InsightService.get_spending_pattern(user_id)
        return pattern
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Spending pattern calculation failure: {str(e)}"
        )

@router.get("/ai-summary", response_model=AIInsightResponse)
async def get_ai_summary(current_user: dict = Depends(get_current_user)):
    try:
        user_id = str(current_user["_id"])
        ai_summary = await AIInsightService.get_ai_summary(user_id)
        return ai_summary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI summary calculation failure: {str(e)}"
        )
