from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.booking import Booking, BookingStatus
from app.models.building import Building
from app.models.lead import Lead, LeadStage
from app.models.unit import Unit, UnitStatus
from app.models.user import User
from app.repositories.booking_repository import get_unit_for_update
from app.schemas.booking import BookingCreate, BookingOut


def create_booking(db: Session, current_user: User, payload: BookingCreate) -> Booking:
    """
    Create a booking for a unit, guaranteeing that a unit can never be
    double-booked even under concurrent requests.

    Flow (all inside one DB transaction):
        BEGIN
          lock the unit row            (SELECT ... FOR UPDATE)
          verify unit still AVAILABLE  (re-check after acquiring the lock)
          verify lead exists
          create booking
          mark unit BOOKED
          move lead to BOOKED stage
        COMMIT

    If two requests race for the same unit, the second one blocks on the
    row lock until the first commits, then sees status=BOOKED and is
    rejected with 409 -- it never gets to create a second booking.

    As a second, independent layer of protection, the `bookings` table has
    a partial unique index allowing only one CONFIRMED booking per unit.
    If that constraint is ever violated (belt-and-suspenders against any
    logic bug or race outside this code path), the resulting IntegrityError
    is caught below and also surfaced as 409 Conflict.
    """
    lead = db.get(Lead, payload.lead_id)
    if lead is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Lead not found.")

    try:
        unit = get_unit_for_update(db, payload.unit_id)

        if unit is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Unit not found.")

        if unit.status != UnitStatus.AVAILABLE:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail=f"Unit {unit.unit_number} is no longer available.",
            )

        booking = Booking(
            lead_id=lead.id,
            unit_id=unit.id,
            booked_by=current_user.id,
            status=BookingStatus.CONFIRMED,
        )
        db.add(booking)

        unit.status = UnitStatus.BOOKED
        lead.stage = LeadStage.BOOKED

        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="This unit was just booked by another employee.",
        ) from exc
    except Exception:
        db.rollback()
        raise

    db.refresh(booking)
    db.refresh(unit)
    db.refresh(lead)
    return booking


def to_booking_out(booking: Booking) -> BookingOut:
    return BookingOut(
        id=booking.id,
        lead_id=booking.lead_id,
        lead_name=booking.lead.name,
        unit_id=booking.unit_id,
        unit_number=booking.unit.unit_number,
        project_name=booking.unit.building.project.name if booking.unit.building else "",
        price=booking.unit.price,
        booked_by=booking.booked_by,
        booked_by_name=booking.booked_by_user.name if booking.booked_by_user else None,
        booking_date=booking.booking_date,
        status=booking.status,
    )


def list_bookings(db: Session, current_user: User) -> list[Booking]:
    from app.models.user import UserRole

    stmt = (
        select(Booking)
        .options(
            joinedload(Booking.lead),
            joinedload(Booking.unit).joinedload(Unit.building).joinedload(Building.project),
            joinedload(Booking.booked_by_user),
        )
        .order_by(Booking.booking_date.desc())
    )
    if current_user.role != UserRole.ADMIN:
        stmt = stmt.where(Booking.booked_by == current_user.id)
    return db.execute(stmt).unique().scalars().all()


def get_booking_or_404(db: Session, booking_id: int) -> Booking:
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Booking not found.")
    return booking
