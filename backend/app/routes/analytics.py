from fastapi import APIRouter, Depends, HTTPException, status
from app.utils.auth import get_current_user
from app.schemas.analytics_schema import AnalyticsSummaryResponse
from app.services.analytics_service import get_analytics_summary

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
