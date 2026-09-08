from datetime import date, datetime

from pydantic import BaseModel


class PipelineStageCount(BaseModel):
    stage: str
    count: int


class DashboardSummary(BaseModel):
    total_leads: int
    active_leads: int
    todays_follow_ups: int
    upcoming_follow_ups: int
    total_bookings: int
    available_units: int
    booked_units: int
    pipeline: list[PipelineStageCount]


class FollowUpItem(BaseModel):
    lead_id: int
    lead_name: str
    phone: str
    next_follow_up: date
    assigned_to_name: str | None
    bucket: str  # OVERDUE | TODAY | TOMORROW | UPCOMING


class RecentBookingItem(BaseModel):
    booking_id: int
    lead_name: str
    unit_number: str
    project_name: str
    booked_by_name: str | None
    booking_date: datetime
