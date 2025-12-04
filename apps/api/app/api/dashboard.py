"""Dashboard endpoints."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.mongo import get_chat_messages_collection
from ..models import Document
from ..models.chat import ChatRole
from ..schemas.dashboard import (
    DashboardMetrics,
    TrendDataPoint,
    TrendsResponse,
    UnansweredQuestion,
    UnansweredQuestionsResponse,
)
from ..schemas.logs import QueryLogItem, QueryLogsResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
) -> DashboardMetrics:
    """Get dashboard KPI metrics from MongoDB chat messages."""
    try:
        messages_coll = get_chat_messages_collection()
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # Count questions today (count user messages)
        questions_today = await messages_coll.count_documents(
            {"role": ChatRole.USER.value, "createdAt": {"$gte": today_start}}
        )

        # Average response time from assistant messages (all time)
        pipeline_avg_response = [
            {
                "$match": {
                    "role": ChatRole.ASSISTANT.value,
                    "queryLog.responseMs": {"$exists": True},
                }
            },
            {"$group": {"_id": None, "avg_ms": {"$avg": "$queryLog.responseMs"}}},
        ]
        avg_response_result = await messages_coll.aggregate(pipeline_avg_response).to_list(1)
        avg_response_time_ms = int(avg_response_result[0]["avg_ms"]) if avg_response_result else 0

        # Fallback rate (last 7 days)
        week_ago = now - timedelta(days=7)
        total_queries = await messages_coll.count_documents(
            {"role": ChatRole.ASSISTANT.value, "createdAt": {"$gte": week_ago}}
        )

        fallback_queries = await messages_coll.count_documents(
            {"role": ChatRole.ASSISTANT.value, "createdAt": {"$gte": week_ago}, "fallback": True}
        )

        fallback_rate = (fallback_queries / total_queries) if total_queries > 0 else 0.0

        # Active documents (from PostgreSQL)
        from sqlalchemy import select

        active_docs_result = await db.execute(
            select(func.count(Document.id)).where(Document.status == "ACTIVE")
        )
        active_documents = active_docs_result.scalar() or 0

        return DashboardMetrics(
            questions_today=questions_today,
            avg_response_time_ms=avg_response_time_ms,
            fallback_rate=fallback_rate,
            active_documents=active_documents,
        )
    except Exception:
        logger.exception("Error fetching dashboard metrics")
        # Return default values on error
        return DashboardMetrics(
            questions_today=0,
            avg_response_time_ms=0,
            fallback_rate=0.0,
            active_documents=0,
        )


@router.get("/trends", response_model=TrendsResponse)
async def get_weekly_trends(
    days: int = Query(default=7, ge=1, le=30),
    db: AsyncSession = Depends(get_db),
) -> TrendsResponse:
    """Get weekly activity trends from MongoDB chat messages."""
    try:
        messages_coll = get_chat_messages_collection()
        now = datetime.utcnow()
        start_date = now - timedelta(days=days - 1)
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)

        # Aggregate data by date using MongoDB
        pipeline = [
            {"$match": {"role": ChatRole.ASSISTANT.value, "createdAt": {"$gte": start_date}}},
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
                    "questions": {"$sum": 1},
                    "avg_confidence": {"$avg": "$confidence"},
                    "fallback_count": {"$sum": {"$cond": [{"$eq": ["$fallback", True]}, 1, 0]}},
                }
            },
            {"$sort": {"_id": 1}},
        ]

        result = await messages_coll.aggregate(pipeline).to_list(None)

        # Build data points
        data_points: list[TrendDataPoint] = []
        data_by_date = {row["_id"]: row for row in result}

        for i in range(days):
            date_obj = start_date + timedelta(days=i)
            date_str = date_obj.strftime("%Y-%m-%d")
            period = date_obj.strftime("%a") if days <= 7 else date_obj.strftime("%m/%d")

            if date_str in data_by_date:
                row = data_by_date[date_str]
                data_points.append(
                    TrendDataPoint(
                        period=period,
                        questions=row["questions"],
                        avg_confidence=row["avg_confidence"] if row["avg_confidence"] else None,
                        fallback_count=row["fallback_count"],
                    )
                )
            else:
                data_points.append(
                    TrendDataPoint(
                        period=period, questions=0, avg_confidence=None, fallback_count=0
                    )
                )

        return TrendsResponse(data=data_points)
    except Exception:
        logger.exception("Error fetching weekly trends")
        # Return empty data on error
        return TrendsResponse(data=[])


@router.get("/unanswered", response_model=UnansweredQuestionsResponse)
async def get_unanswered_questions(
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> UnansweredQuestionsResponse:
    """Get list of unanswered questions (fallback messages) from MongoDB."""
    try:
        messages_coll = get_chat_messages_collection()

        # Get fallback messages (assistant messages with fallback=true) ordered by most recent
        cursor = (
            messages_coll.find({"role": ChatRole.ASSISTANT.value, "fallback": True})
            .sort("createdAt", -1)
            .limit(limit)
        )

        fallback_messages = await cursor.to_list(length=limit)

        # Get total count
        total = await messages_coll.count_documents(
            {"role": ChatRole.ASSISTANT.value, "fallback": True}
        )

        items = []
        for idx, msg in enumerate(fallback_messages):
            # Get the corresponding user question
            session_id = msg.get("sessionId")
            created_at = msg.get("createdAt")

            # Find the user message just before this assistant message
            user_msg = await messages_coll.find_one(
                {
                    "sessionId": session_id,
                    "role": ChatRole.USER.value,
                    "createdAt": {"$lte": created_at},
                },
                sort=[("createdAt", -1)],
            )

            question_text = (
                user_msg.get("text", "Unknown question") if user_msg else "Unknown question"
            )

            # Determine reason from queryLog if available
            query_log = msg.get("queryLog", {})
            reason = "Low confidence" if query_log.get("fallback") else "Fallback triggered"

            # Get channel from session or queryLog
            channel = query_log.get("channel") or "widget"

            items.append(
                UnansweredQuestion(
                    id=idx + 1,  # Use index as ID since MongoDB _id is not sequential
                    question=question_text,
                    reason=reason,
                    channel=channel,
                    createdAt=created_at or datetime.utcnow(),
                    status="In Progress",
                )
            )

        return UnansweredQuestionsResponse(items=items, total=total)
    except Exception:
        logger.exception("Error fetching unanswered questions")
        # Return empty list on error
        return UnansweredQuestionsResponse(items=[], total=0)


@router.get("/logs", response_model=QueryLogsResponse)
async def get_query_logs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="pageSize"),
    search: str | None = Query(default=None),
    fallback: bool | None = Query(default=None),
    lang: str | None = Query(default=None),
    channel: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> QueryLogsResponse:
    """Get paginated query logs with filtering from MongoDB."""
    try:
        messages_coll = get_chat_messages_collection()

        # Build query filter
        query_filter: dict = {"role": ChatRole.ASSISTANT.value}

        if fallback is not None:
            query_filter["fallback"] = fallback

        if lang:
            # Query trong queryLog.lang
            query_filter["queryLog.lang"] = lang

        if channel:
            # Query trong queryLog.channel
            query_filter["queryLog.channel"] = channel

        # Text search on question (we'll need to join with user messages)
        # For now, search in assistant message text (answer)
        if search:
            query_filter["text"] = {"$regex": search, "$options": "i"}

        # Get total count
        total = await messages_coll.count_documents(query_filter)

        # Calculate pagination
        skip = (page - 1) * page_size
        total_pages = (total + page_size - 1) // page_size if total > 0 else 1

        # Fetch paginated results
        cursor = messages_coll.find(query_filter).sort("createdAt", -1).skip(skip).limit(page_size)
        assistant_messages = await cursor.to_list(length=page_size)

        # Batch fetch user questions for all sessions
        session_ids = list(
            {msg.get("sessionId") for msg in assistant_messages if msg.get("sessionId")}
        )
        user_messages = {}
        if session_ids:
            user_cursor = messages_coll.find(
                {"sessionId": {"$in": session_ids}, "role": ChatRole.USER.value}
            ).sort("createdAt", -1)
            user_msgs_list = await user_cursor.to_list(length=None)
            # Group by sessionId, keeping only most recent before each assistant msg
            for user_msg in user_msgs_list:
                sid = user_msg.get("sessionId")
                if sid not in user_messages:
                    user_messages[sid] = []
                user_messages[sid].append(user_msg)

        # Build response items
        items: list[QueryLogItem] = []
        for msg in assistant_messages:
            session_id = msg.get("sessionId", "")
            created_at = msg.get("createdAt")

            # Find user question just before this assistant message
            question_text = ""
            if session_id in user_messages:
                for user_msg in user_messages[session_id]:
                    if user_msg.get("createdAt", datetime.min) <= (created_at or datetime.max):
                        question_text = user_msg.get("text", "")
                        break

            query_log = msg.get("queryLog", {})

            items.append(
                QueryLogItem(
                    id=msg.get("_id", ""),
                    sessionId=session_id,
                    question=question_text,
                    answer=msg.get("text", ""),
                    confidence=msg.get("confidence"),
                    fallback=msg.get("fallback", False),
                    lang=query_log.get("lang", "en"),
                    channel=query_log.get("channel"),
                    userAgent=query_log.get("userAgent"),
                    responseMs=query_log.get("responseMs"),
                    feedback=msg.get("feedback"),
                    timestamp=created_at or datetime.utcnow(),
                )
            )

        return QueryLogsResponse(
            items=items,
            total=total,
            page=page,
            pageSize=page_size,
            totalPages=total_pages,
        )
    except Exception:
        logger.exception("Error fetching query logs")
        # Return empty list on error
        return QueryLogsResponse(
            items=[],
            total=0,
            page=page,
            pageSize=page_size,
            totalPages=1,
        )
