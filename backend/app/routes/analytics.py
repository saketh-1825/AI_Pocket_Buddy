from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.utils.auth import get_current_user
from app.schemas.analytics_schema import (
    AnalyticsSummaryResponse, 
    AnalyticsTrendsResponse,
    AnalyticsHeatmapResponse,
    AnalyticsRunningBalanceResponse
)
from app.services.analytics_service import get_analytics_summary
from app.services.trend_service import get_analytics_trends
from app.services.pandas_service import PandasAnalyticsService
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

@router.get("/heatmap", response_model=AnalyticsHeatmapResponse)
async def get_heatmap(current_user: dict = Depends(get_current_user)):
    try:
        user_id = str(current_user["_id"])
        df = await PandasAnalyticsService.load_expenses_dataframe(user_id)
        df_prepared = PandasAnalyticsService.prepare_dataframe(df)
        heatmap_records = PandasAnalyticsService.get_category_heatmap(df_prepared)
        
        flat_heatmap = []
        for record in heatmap_records:
            day_name = record.get("day_name")
            for hour in range(24):
                val = record.get(hour, 0.0)
                flat_heatmap.append({
                    "day": day_name,
                    "hour": hour,
                    "amount": float(val)
                })
        return {"heatmap": flat_heatmap}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Heatmap calculation failure: {str(e)}"
        )

@router.get("/running-balance", response_model=AnalyticsRunningBalanceResponse)
async def get_running_balance(current_user: dict = Depends(get_current_user)):
    try:
        user_id = str(current_user["_id"])
        df = await PandasAnalyticsService.load_expenses_dataframe(user_id)
        df_prepared = PandasAnalyticsService.prepare_dataframe(df)
        running_balance = PandasAnalyticsService.get_running_balance(df_prepared)
        return {"running_balance": running_balance}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Running balance calculation failure: {str(e)}"
        )

