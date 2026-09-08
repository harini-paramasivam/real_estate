from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_admin, require_any_role
from app.core.database import get_db
from app.models.lead import LeadStage
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadListOut, LeadNoteCreate, LeadNoteOut, LeadOut, LeadUpdate
from app.services import lead_service

router = APIRouter(prefix="/api/leads", tags=["leads"])


@router.get("", response_model=LeadListOut)
def list_leads(
    search: str | None = None,
    stage: LeadStage | None = None,
    assigned_to: int | None = None,
    follow_up: str | None = Query(default=None, pattern="^(overdue|today|upcoming)$"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role),
) -> LeadListOut:
    items, total = lead_service.list_leads(
        db,
        current_user,
        search=search,
        stage=stage,
        assigned_to=assigned_to,
        follow_up=follow_up,
        page=page,
        limit=limit,
    )
    return LeadListOut(
        items=[LeadOut.model_validate(item) for item in items], total=total, page=page, limit=limit
    )


@router.post("", response_model=LeadOut, status_code=201)
def create_lead(
    payload: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role),
) -> LeadOut:
    lead = lead_service.create_lead(db, current_user, payload)
    return LeadOut.model_validate(lead)


@router.get("/{lead_id}", response_model=LeadOut)
def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role),
) -> LeadOut:
    lead = lead_service.get_lead_or_404(db, lead_id, current_user)
    return LeadOut.model_validate(lead)


@router.put("/{lead_id}", response_model=LeadOut)
def update_lead(
    lead_id: int,
    payload: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role),
) -> LeadOut:
    lead = lead_service.update_lead(db, current_user, lead_id, payload)
    return LeadOut.model_validate(lead)


@router.post("/{lead_id}/notes", response_model=LeadNoteOut, status_code=201)
def add_note(
    lead_id: int,
    payload: LeadNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role),
) -> LeadNoteOut:
    note = lead_service.add_note(db, current_user, lead_id, payload)
    return LeadNoteOut.model_validate(note)


@router.get("/{lead_id}/notes", response_model=list[LeadNoteOut])
def list_notes(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role),
) -> list[LeadNoteOut]:
    notes = lead_service.list_notes(db, current_user, lead_id)
    return [LeadNoteOut.model_validate(n) for n in notes]


@router.delete("/{lead_id}", status_code=204)
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    """
    Admin-only. Leads with an associated booking cannot be deleted, since
    that would destroy booking history -- see booking model deletion notes.
    """
    lead_service.delete_lead(db, lead_id)
