from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.dependencies import require_admin, require_any_role
from app.core.database import get_db
from app.models.building import Building
from app.models.project import Project
from app.models.unit import Unit
from app.models.user import User
from app.repositories.property_repository import count_buildings_and_units, count_units_for_building
from app.schemas.property import (
    BuildingCreate,
    BuildingOut,
    ProjectCreate,
    ProjectDetailOut,
    ProjectOut,
    ProjectUpdate,
    UnitCreate,
    UnitOut,
    UnitUpdate,
)
from app.services import property_service

router = APIRouter(prefix="/api", tags=["properties"])


def _project_out(db: Session, project: Project) -> ProjectOut:
    building_count, unit_count = count_buildings_and_units(db, project.id)
    return ProjectOut(
        id=project.id,
        name=project.name,
        location=project.location,
        description=project.description,
        created_at=project.created_at,
        building_count=building_count,
        unit_count=unit_count,
    )


def _building_out(db: Session, building: Building) -> BuildingOut:
    return BuildingOut(
        id=building.id,
        project_id=building.project_id,
        name=building.name,
        description=building.description,
        created_at=building.created_at,
        unit_count=count_units_for_building(db, building.id),
    )


@router.get("/projects", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db), _: User = Depends(require_any_role)) -> list[ProjectOut]:
    projects = db.execute(select(Project).order_by(Project.name)).scalars().all()
    return [_project_out(db, p) for p in projects]


@router.post("/projects", response_model=ProjectOut, status_code=201)
def create_project(
    payload: ProjectCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)
) -> ProjectOut:
    project = property_service.create_project(db, payload)
    return _project_out(db, project)


@router.get("/projects/{project_id}", response_model=ProjectDetailOut)
def get_project(
    project_id: int, db: Session = Depends(get_db), _: User = Depends(require_any_role)
) -> ProjectDetailOut:
    project = property_service.get_project_or_404(db, project_id)
    buildings = db.execute(select(Building).where(Building.project_id == project_id)).scalars().all()
    base = _project_out(db, project)
    return ProjectDetailOut(**base.model_dump(), buildings=[_building_out(db, b) for b in buildings])


@router.put("/projects/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ProjectOut:
    project = property_service.update_project(db, project_id, payload)
    return _project_out(db, project)


@router.get("/projects/{project_id}/buildings", response_model=list[BuildingOut])
def list_buildings(
    project_id: int, db: Session = Depends(get_db), _: User = Depends(require_any_role)
) -> list[BuildingOut]:
    property_service.get_project_or_404(db, project_id)
    buildings = db.execute(select(Building).where(Building.project_id == project_id)).scalars().all()
    return [_building_out(db, b) for b in buildings]


@router.post("/projects/{project_id}/buildings", response_model=BuildingOut, status_code=201)
def create_building(
    project_id: int,
    payload: BuildingCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> BuildingOut:
    building = property_service.create_building(db, project_id, payload)
    return _building_out(db, building)


@router.get("/buildings/{building_id}/units", response_model=list[UnitOut])
def list_units(
    building_id: int, db: Session = Depends(get_db), _: User = Depends(require_any_role)
) -> list[UnitOut]:
    property_service.get_building_or_404(db, building_id)
    units = db.execute(select(Unit).where(Unit.building_id == building_id).order_by(Unit.unit_number)).scalars().all()
    return [UnitOut.model_validate(u) for u in units]


@router.post("/buildings/{building_id}/units", response_model=UnitOut, status_code=201)
def create_unit(
    building_id: int,
    payload: UnitCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> UnitOut:
    unit = property_service.create_unit(db, building_id, payload)
    return UnitOut.model_validate(unit)


@router.get("/units/{unit_id}", response_model=UnitOut)
def get_unit(unit_id: int, db: Session = Depends(get_db), _: User = Depends(require_any_role)) -> UnitOut:
    unit = property_service.get_unit_or_404(db, unit_id)
    return UnitOut.model_validate(unit)


@router.put("/units/{unit_id}", response_model=UnitOut)
def update_unit(
    unit_id: int,
    payload: UnitUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> UnitOut:
    unit = property_service.update_unit(db, unit_id, payload)
    return UnitOut.model_validate(unit)
