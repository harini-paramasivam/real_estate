from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import require_any_role
from app.core.database import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardSummary, FollowUpItem, RecentBookingItem
from app.services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def summary(db: Session = Depends(get_db), current_user: User = Depends(require_any_role)) -> DashboardSummary:
    return dashboard_service.get_summary(db, current_user)


@router.get("/follow-ups", response_model=list[FollowUpItem])
def follow_ups(
    db: Session = Depends(get_db), current_user: User = Depends(require_any_role)
) -> list[FollowUpItem]:
    return dashboard_service.get_follow_ups(db, current_user)


@router.get("/recent-bookings", response_model=list[RecentBookingItem])
def recent_bookings(
    db: Session = Depends(get_db), current_user: User = Depends(require_any_role)
) -> list[RecentBookingItem]:
    return dashboard_service.get_recent_bookings(db, current_user)
