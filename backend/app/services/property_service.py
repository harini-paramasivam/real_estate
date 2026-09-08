from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.building import Building
from app.models.project import Project
from app.models.unit import Unit
from app.schemas.property import BuildingCreate, ProjectCreate, ProjectUpdate, UnitCreate, UnitUpdate


def create_project(db: Session, payload: ProjectCreate) -> Project:
    project = Project(**payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def get_project_or_404(db: Session, project_id: int) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return project


def update_project(db: Session, project_id: int, payload: ProjectUpdate) -> Project:
    project = get_project_or_404(db, project_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


def create_building(db: Session, project_id: int, payload: BuildingCreate) -> Building:
    get_project_or_404(db, project_id)  # ensures building belongs to a valid project
    building = Building(project_id=project_id, **payload.model_dump())
    db.add(building)
    db.commit()
    db.refresh(building)
    return building


def get_building_or_404(db: Session, building_id: int) -> Building:
    building = db.get(Building, building_id)
    if building is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Building not found.")
    return building


def create_unit(db: Session, building_id: int, payload: UnitCreate) -> Unit:
    get_building_or_404(db, building_id)  # ensures unit belongs to a valid building
    unit = Unit(building_id=building_id, **payload.model_dump())
    db.add(unit)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"Unit number '{payload.unit_number}' already exists in this building.",
        ) from exc
    db.refresh(unit)
    return unit


def get_unit_or_404(db: Session, unit_id: int) -> Unit:
    unit = db.get(Unit, unit_id)
    if unit is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Unit not found.")
    return unit


def update_unit(db: Session, unit_id: int, payload: UnitUpdate) -> Unit:
    unit = get_unit_or_404(db, unit_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(unit, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Unit number already exists in this building.") from exc
    db.refresh(unit)
    return unit
