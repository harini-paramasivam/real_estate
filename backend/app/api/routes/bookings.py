from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import require_any_role
from app.core.database import get_db
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingOut
from app.services import booking_service

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.get("", response_model=list[BookingOut])
def list_bookings(
    db: Session = Depends(get_db), current_user: User = Depends(require_any_role)
) -> list[BookingOut]:
    bookings = booking_service.list_bookings(db, current_user)
    return [booking_service.to_booking_out(b) for b in bookings]


@router.post("", response_model=BookingOut, status_code=201)
def create_booking(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role),
) -> BookingOut:
    booking = booking_service.create_booking(db, current_user, payload)
    return booking_service.to_booking_out(booking)


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(
    booking_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_any_role)
) -> BookingOut:
    booking = booking_service.get_booking_or_404(db, booking_id)
    return booking_service.to_booking_out(booking)
