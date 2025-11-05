"""Admin endpoints for metrics and logs."""

from fastapi import APIRouter, Depends

from ..core.users import get_current_user
from ..services import metrics

router = APIRouter()


@router.get("/metrics")
async def get_metrics(current_user=Depends(get_current_user)) -> dict[str, object]:
    return await metrics.get_dashboard_metrics()


@router.get("/logs")
async def get_logs(current_user=Depends(get_current_user)) -> dict[str, list]:
    return {"items": await metrics.get_query_logs()
