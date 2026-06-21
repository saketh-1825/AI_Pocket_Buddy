from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.utils.auth import get_current_user
from app.schemas.analytics_schema import AnalyticsSummaryResponse, AnalyticsTrendsResponse
from app.services.analytics_service import get_analytics_summary
from app.services.trend_service import get_analytics_trends
from typing import Optional

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/summary", response_model=AnalyticsSummaryResponse)
async def get_summary(current_user: dict = Depends(get_current_user)):
    try:
        user_id = str(current_user["_id"])
        summary = await get_analytics_summary(user_id)
        if not summary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No expenses found for this user"
            )
        return summary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Aggregation failure: {str(e)}"
        )

@router.get("/trends", response_model=AnalyticsTrendsResponse)
async def get_trends(
    range: Optional[str] = Query(None, description="Preset date range (7d, 30d, 90d, custom)"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    current_user: dict = Depends(get_current_user)
):
    try:
        user_id = str(current_user["_id"])
        trends = await get_analytics_trends(
            user_id=user_id,
            range_opt=range,
            start_date=start_date,
            end_date=end_date
        )
        return trends
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Trends calculation failure: {str(e)}"
        )
