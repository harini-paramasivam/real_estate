import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BookingStatus(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"


class Booking(Base):
    """
    Double-booking protection has two independent layers:

    1. Application layer: booking_service acquires a row-level lock on the
       Unit (SELECT ... FOR UPDATE) inside a transaction, re-checks
       availability, and only then creates the booking and flips the unit
       status. This serializes concurrent booking attempts for the same unit.

    2. Database layer: a partial unique index guarantees at the schema level
       that a given unit can never have more than one CONFIRMED booking,
       independent of application logic. Even if the app-level lock were
       bypassed, the database rejects the second concurrent INSERT with a
       unique-violation, which the service translates into 409 Conflict.
    """

    __tablename__ = "bookings"
    __table_args__ = (
        # Partial unique index: at most one CONFIRMED booking may ever exist
        # for a given unit. This is the database-level backstop for the
        # double-booking rule described above.
        Index(
            "uq_one_confirmed_booking_per_unit",
            "unit_id",
            unique=True,
            postgresql_where=text("status = 'CONFIRMED'"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    lead_id: Mapped[int] = mapped_column(ForeignKey("leads.id", ondelete="RESTRICT"), nullable=False)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id", ondelete="RESTRICT"), nullable=False)
    booked_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    booking_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus, name="booking_status"), default=BookingStatus.CONFIRMED, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    lead = relationship("Lead", back_populates="bookings")
    unit = relationship("Unit", back_populates="bookings")
    booked_by_user = relationship("User", back_populates="bookings")
