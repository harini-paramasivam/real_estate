from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.unit import UnitStatus, UnitType


class UnitCreate(BaseModel):
    unit_number: str = Field(min_length=1, max_length=30)
    unit_type: UnitType
    price: Decimal = Field(gt=0)


class UnitUpdate(BaseModel):
    unit_number: str | None = Field(default=None, min_length=1, max_length=30)
    unit_type: UnitType | None = None
    price: Decimal | None = Field(default=None, gt=0)
    status: UnitStatus | None = None


class UnitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    building_id: int
    unit_number: str
    unit_type: UnitType
    price: Decimal
    status: UnitStatus
    created_at: datetime


class BuildingCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None


class BuildingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    name: str
    description: str | None
    created_at: datetime
    unit_count: int = 0


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    location: str = Field(min_length=1, max_length=150)
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    location: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    location: str
    description: str | None
    created_at: datetime
    building_count: int = 0
    unit_count: int = 0


class ProjectDetailOut(ProjectOut):
    buildings: list[BuildingOut] = []
