from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.booking import Booking
from app.models.building import Building
from app.models.lead import Lead, LeadStage
from app.models.unit import Unit, UnitStatus
from app.models.user import User, UserRole
from app.schemas.dashboard import DashboardSummary, FollowUpItem, PipelineStageCount, RecentBookingItem


def _lead_scope(db_query, current_user: User):
    if current_user.role != UserRole.ADMIN:
        return db_query.where(Lead.assigned_to == current_user.id)
    return db_query


def get_summary(db: Session, current_user: User) -> DashboardSummary:
    today = date.today()

    total_leads = db.scalar(_lead_scope(select(func.count(Lead.id)), current_user)) or 0
    active_leads = (
        db.scalar(
            _lead_scope(
                select(func.count(Lead.id)).where(Lead.stage.notin_([LeadStage.BOOKED, LeadStage.LOST])),
                current_user,
            )
        )
        or 0
    )
    todays_follow_ups = (
        db.scalar(_lead_scope(select(func.count(Lead.id)).where(Lead.next_follow_up == today), current_user)) or 0
    )
    upcoming_follow_ups = (
        db.scalar(_lead_scope(select(func.count(Lead.id)).where(Lead.next_follow_up > today), current_user)) or 0
    )

    booking_stmt = select(func.count(Booking.id))
    if current_user.role != UserRole.ADMIN:
        booking_stmt = booking_stmt.where(Booking.booked_by == current_user.id)
    total_bookings = db.scalar(booking_stmt) or 0

    available_units = db.scalar(select(func.count(Unit.id)).where(Unit.status == UnitStatus.AVAILABLE)) or 0
    booked_units = db.scalar(select(func.count(Unit.id)).where(Unit.status == UnitStatus.BOOKED)) or 0

    pipeline_rows = db.execute(
        _lead_scope(select(Lead.stage, func.count(Lead.id)).group_by(Lead.stage), current_user)
    ).all()
    counts = {stage.value: 0 for stage in LeadStage}
    for stage, count in pipeline_rows:
        counts[stage.value] = count
    ordered_stages = [
        LeadStage.NEW,
        LeadStage.CONTACTED,
        LeadStage.SITE_VISIT,
        LeadStage.INTERESTED,
        LeadStage.NEGOTIATION,
        LeadStage.BOOKED,
        LeadStage.LOST,
    ]
    pipeline = [PipelineStageCount(stage=s.value, count=counts[s.value]) for s in ordered_stages]

    return DashboardSummary(
        total_leads=total_leads,
        active_leads=active_leads,
        todays_follow_ups=todays_follow_ups,
        upcoming_follow_ups=upcoming_follow_ups,
        total_bookings=total_bookings,
        available_units=available_units,
        booked_units=booked_units,
        pipeline=pipeline,
    )


def get_follow_ups(db: Session, current_user: User) -> list[FollowUpItem]:
    today = date.today()
    stmt = (
        _lead_scope(
            select(Lead).options(joinedload(Lead.assigned_to_user)).where(Lead.next_follow_up.is_not(None)),
            current_user,
        )
    ).order_by(Lead.next_follow_up.asc())
    leads = db.execute(stmt).unique().scalars().all()

    items: list[FollowUpItem] = []
    for lead in leads:
        if lead.next_follow_up < today:
            bucket = "OVERDUE"
        elif lead.next_follow_up == today:
            bucket = "TODAY"
        elif lead.next_follow_up == today + timedelta(days=1):
            bucket = "TOMORROW"
        else:
            bucket = "UPCOMING"
        items.append(
            FollowUpItem(
                lead_id=lead.id,
                lead_name=lead.name,
                phone=lead.phone,
                next_follow_up=lead.next_follow_up,
                assigned_to_name=lead.assigned_to_user.name if lead.assigned_to_user else None,
                bucket=bucket,
            )
        )
    return items


def get_recent_bookings(db: Session, current_user: User, limit: int = 10) -> list[RecentBookingItem]:
    stmt = (
        select(Booking)
        .options(
            joinedload(Booking.lead),
            joinedload(Booking.unit).joinedload(Unit.building).joinedload(Building.project),
            joinedload(Booking.booked_by_user),
        )
        .order_by(Booking.booking_date.desc())
        .limit(limit)
    )
    if current_user.role != UserRole.ADMIN:
        stmt = stmt.where(Booking.booked_by == current_user.id)
    bookings = db.execute(stmt).unique().scalars().all()

    return [
        RecentBookingItem(
            booking_id=b.id,
            lead_name=b.lead.name,
            unit_number=b.unit.unit_number,
            project_name=b.unit.building.project.name if b.unit.building else "",
            booked_by_name=b.booked_by_user.name if b.booked_by_user else None,
            booking_date=b.booking_date,
        )
        for b in bookings
    ]
