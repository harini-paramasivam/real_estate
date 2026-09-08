from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.lead import LeadSource, LeadStage
from app.schemas.user import UserOut


class LeadNoteCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class LeadNoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    content: str
    created_at: datetime
    created_by_user: UserOut | None = None


class LeadCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr | None = None
    phone: str = Field(pattern=r"^\d{10}$")
    source: LeadSource = LeadSource.OTHER
    assigned_to: int | None = None
    next_follow_up: date | None = None

    @field_validator("next_follow_up")
    @classmethod
    def follow_up_not_in_past(cls, value: date | None) -> date | None:
        if value is not None and value < date.today():
            raise ValueError("next_follow_up cannot be in the past")
        return value


class LeadUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, pattern=r"^\d{10}$")
    source: LeadSource | None = None
    stage: LeadStage | None = None
    assigned_to: int | None = None
    next_follow_up: date | None = None


class LeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr | None
    phone: str
    source: LeadSource
    stage: LeadStage
    assigned_to: int | None
    assigned_to_user: UserOut | None = None
    next_follow_up: date | None
    created_at: datetime
    updated_at: datetime


class LeadListOut(BaseModel):
    items: list[LeadOut]
    total: int
    page: int
    limit: int
