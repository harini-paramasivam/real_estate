import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Numeric, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UnitType(str, enum.Enum):
    ONE_BHK = "1_BHK"
    TWO_BHK = "2_BHK"
    THREE_BHK = "3_BHK"
    VILLA = "VILLA"
    PLOT = "PLOT"


class UnitStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    RESERVED = "RESERVED"
    BOOKED = "BOOKED"


class Unit(Base):
    __tablename__ = "units"
    __table_args__ = (
        UniqueConstraint("building_id", "unit_number", name="uq_unit_number_per_building"),
        CheckConstraint("price > 0", name="ck_unit_price_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    building_id: Mapped[int] = mapped_column(ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False)
    unit_number: Mapped[str] = mapped_column(String(30), nullable=False)
    unit_type: Mapped[UnitType] = mapped_column(Enum(UnitType, name="unit_type"), nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    status: Mapped[UnitStatus] = mapped_column(
        Enum(UnitStatus, name="unit_status"), default=UnitStatus.AVAILABLE, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    building = relationship("Building", back_populates="units")
    bookings = relationship("Booking", back_populates="unit")
