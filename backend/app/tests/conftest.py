import os

os.environ["DATABASE_URL"] = "postgresql+psycopg2://postgres:postgres@localhost:5432/real_estate_crm_test"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.core.security import hash_password
from app.main import app
from app.models.building import Building
from app.models.lead import Lead, LeadSource, LeadStage
from app.models.project import Project
from app.models.unit import Unit, UnitStatus, UnitType
from app.models.user import User, UserRole

TEST_DATABASE_URL = "postgresql+psycopg2://postgres:postgres@localhost:5432/real_estate_crm_test"

engine = create_engine(TEST_DATABASE_URL, future=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def clean_tables():
    """Truncate all tables before every test for isolation."""
    with engine.begin() as conn:
        conn.execute(
            text(
                "TRUNCATE TABLE bookings, lead_notes, leads, units, buildings, projects, users "
                "RESTART IDENTITY CASCADE"
            )
        )
    yield


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    yield session
    session.close()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def admin_user(db_session):
    user = User(
        name="Admin User",
        email="admin@test.io",
        hashed_password=hash_password("Admin@123"),
        role=UserRole.ADMIN,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def sales_user(db_session):
    user = User(
        name="Sales One",
        email="sales1@test.io",
        hashed_password=hash_password("Sales@123"),
        role=UserRole.SALES_EMPLOYEE,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def sales_user_2(db_session):
    user = User(
        name="Sales Two",
        email="sales2@test.io",
        hashed_password=hash_password("Sales@123"),
        role=UserRole.SALES_EMPLOYEE,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def auth_headers(client: TestClient, email: str, password: str) -> dict[str, str]:
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def project_building_unit(db_session):
    project = Project(name="Test Project", location="Test City")
    db_session.add(project)
    db_session.flush()
    building = Building(project_id=project.id, name="Block A")
    db_session.add(building)
    db_session.flush()
    unit = Unit(building_id=building.id, unit_number="A-101", unit_type=UnitType.TWO_BHK, price=5000000)
    db_session.add(unit)
    db_session.commit()
    db_session.refresh(unit)
    db_session.refresh(building)
    db_session.refresh(project)
    return project, building, unit


@pytest.fixture
def sample_lead(db_session, sales_user):
    lead = Lead(
        name="Test Lead",
        email="lead@test.io",
        phone="9000000000",
        source=LeadSource.WEBSITE,
        stage=LeadStage.NEW,
        assigned_to=sales_user.id,
    )
    db_session.add(lead)
    db_session.commit()
    db_session.refresh(lead)
    return lead
