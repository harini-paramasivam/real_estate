from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.lead import Lead, LeadNote
from app.models.user import User, UserRole
from app.repositories.lead_repository import build_lead_query
from app.schemas.lead import LeadCreate, LeadNoteCreate, LeadUpdate


def list_leads(
    db: Session,
    current_user: User,
    *,
    search: str | None,
    stage,
    assigned_to: int | None,
    follow_up: str | None,
    page: int,
    limit: int,
) -> tuple[list[Lead], int]:
    restrict_to = None if current_user.role == UserRole.ADMIN else current_user.id
    query = build_lead_query(
        db,
        search=search,
        stage=stage,
        assigned_to=assigned_to,
        follow_up=follow_up,
        restrict_to_user_id=restrict_to,
    )
    total = len(db.execute(query).unique().scalars().all())
    items = (
        db.execute(query.offset((page - 1) * limit).limit(limit)).unique().scalars().all()
    )
    return items, total


def get_lead_or_404(db: Session, lead_id: int, current_user: User) -> Lead:
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Lead not found.")
    _ensure_can_view(lead, current_user)
    return lead


def _ensure_can_view(lead: Lead, current_user: User) -> None:
    if current_user.role == UserRole.ADMIN:
        return
    if lead.assigned_to != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="You cannot access another employee's lead.")


def _ensure_can_edit(lead: Lead, current_user: User) -> None:
    if current_user.role == UserRole.ADMIN:
        return
    if lead.assigned_to != current_user.id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="You cannot modify a lead that is not assigned to you.",
        )


def create_lead(db: Session, current_user: User, payload: LeadCreate) -> Lead:
    assigned_to = payload.assigned_to
    if current_user.role != UserRole.ADMIN:
        # Sales employees can only create leads assigned to themselves.
        assigned_to = current_user.id

    lead = Lead(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        source=payload.source,
        assigned_to=assigned_to,
        next_follow_up=payload.next_follow_up,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


def update_lead(db: Session, current_user: User, lead_id: int, payload: LeadUpdate) -> Lead:
    lead = get_lead_or_404(db, lead_id, current_user)
    _ensure_can_edit(lead, current_user)

    data = payload.model_dump(exclude_unset=True)

    if "assigned_to" in data and current_user.role != UserRole.ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Only admins can reassign leads.")

    for field, value in data.items():
        setattr(lead, field, value)

    db.commit()
    db.refresh(lead)
    return lead


def add_note(db: Session, current_user: User, lead_id: int, payload: LeadNoteCreate) -> LeadNote:
    lead = get_lead_or_404(db, lead_id, current_user)
    _ensure_can_edit(lead, current_user)

    note = LeadNote(lead_id=lead.id, created_by=current_user.id, content=payload.content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def list_notes(db: Session, current_user: User, lead_id: int) -> list[LeadNote]:
    lead = get_lead_or_404(db, lead_id, current_user)
    return lead.notes


def delete_lead(db: Session, lead_id: int) -> None:
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Lead not found.")
    if lead.bookings:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="This lead has booking history and cannot be deleted.",
        )
    db.delete(lead)
    db.commit()
