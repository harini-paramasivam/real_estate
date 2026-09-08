from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.building import Building
from app.models.unit import Unit


def count_buildings_and_units(db: Session, project_id: int) -> tuple[int, int]:
    building_count = db.scalar(select(func.count(Building.id)).where(Building.project_id == project_id)) or 0
    unit_count = (
        db.scalar(
            select(func.count(Unit.id))
            .join(Building, Unit.building_id == Building.id)
            .where(Building.project_id == project_id)
        )
        or 0
    )
    return building_count, unit_count


def count_units_for_building(db: Session, building_id: int) -> int:
    return db.scalar(select(func.count(Unit.id)).where(Unit.building_id == building_id)) or 0
