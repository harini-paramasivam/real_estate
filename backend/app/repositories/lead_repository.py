from datetime import date

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.lead import Lead, LeadStage


def build_lead_query(
    db: Session,
    *,
    search: str | None = None,
    stage: LeadStage | None = None,
    assigned_to: int | None = None,
    follow_up: str | None = None,
    restrict_to_user_id: int | None = None,
):
    query = select(Lead).options(joinedload(Lead.assigned_to_user))

    if restrict_to_user_id is not None:
        query = query.where(Lead.assigned_to == restrict_to_user_id)

    if search:
        like = f"%{search}%"
        query = query.where(or_(Lead.name.ilike(like), Lead.phone.ilike(like), Lead.email.ilike(like)))

    if stage:
        query = query.where(Lead.stage == stage)

    if assigned_to is not None:
        query = query.where(Lead.assigned_to == assigned_to)

    if follow_up == "overdue":
        query = query.where(Lead.next_follow_up < date.today())
    elif follow_up == "today":
        query = query.where(Lead.next_follow_up == date.today())
    elif follow_up == "upcoming":
        query = query.where(Lead.next_follow_up > date.today())

    return query.order_by(Lead.created_at.desc())
