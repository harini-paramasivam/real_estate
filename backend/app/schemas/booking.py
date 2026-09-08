from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.booking import BookingStatus


class BookingCreate(BaseModel):
    lead_id: int
    unit_id: int


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    lead_name: str
    unit_id: int
    unit_number: str
    project_name: str
    price: Decimal
    booked_by: int | None
    booked_by_name: str | None
    booking_date: datetime
    status: BookingStatus
