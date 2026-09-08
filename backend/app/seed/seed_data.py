"""
Populate the database with realistic demo data so the application never
opens empty. Safe to re-run: it wipes and recreates seedable tables first.

Usage:
    python -m app.seed.seed_data
"""
import random
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import text

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.booking import Booking, BookingStatus
from app.models.building import Building
from app.models.lead import Lead, LeadNote, LeadSource, LeadStage
from app.models.project import Project
from app.models.unit import Unit, UnitStatus, UnitType
from app.models.user import User, UserRole

FIRST_NAMES = [
    "Arjun", "Priya", "Karthik", "Divya", "Rahul", "Ananya", "Vijay", "Meera",
    "Sanjay", "Lakshmi", "Suresh", "Anitha", "Ramesh", "Kavya", "Naveen",
    "Sneha", "Manoj", "Pooja", "Deepak", "Swathi", "Ganesh", "Ritu",
]
LAST_NAMES = [
    "Kumar", "Sharma", "Iyer", "Reddy", "Nair", "Rao", "Menon", "Pillai",
    "Krishnan", "Subramaniam", "Raman", "Chandran",
]


def random_name() -> str:
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def random_phone() -> str:
    return f"9{random.randint(100000000, 999999999)}"


def run() -> None:
    db = SessionLocal()
    try:
        print("Clearing existing seedable data...")
        db.execute(text("TRUNCATE TABLE bookings, lead_notes, leads, units, buildings, projects, users RESTART IDENTITY CASCADE"))
        db.commit()

        print("Creating users...")
        admin = User(
            name="Admin User",
            email="admin@realestatecrm.io",
            hashed_password=hash_password("Admin@123"),
            role=UserRole.ADMIN,
        )
        emp1 = User(
            name="Rahul Verma",
            email="rahul@realestatecrm.io",
            hashed_password=hash_password("Sales@123"),
            role=UserRole.SALES_EMPLOYEE,
        )
        emp2 = User(
            name="Priya Sharma",
            email="priya@realestatecrm.io",
            hashed_password=hash_password("Sales@123"),
            role=UserRole.SALES_EMPLOYEE,
        )
        db.add_all([admin, emp1, emp2])
        db.commit()
        employees = [emp1, emp2]

        print("Creating projects, buildings, units...")
        project_specs = [
            ("Green Valley Residency", "Chennai", "A premium residential enclave with landscaped gardens."),
            ("Ocean View Residency", "Puducherry", "Seafront apartments with panoramic ocean views."),
        ]
        unit_prices = {
            UnitType.ONE_BHK: (3500000, 4500000),
            UnitType.TWO_BHK: (5500000, 7200000),
            UnitType.THREE_BHK: (7800000, 9800000),
            UnitType.VILLA: (12000000, 18000000),
            UnitType.PLOT: (2500000, 4000000),
        }

        all_units: list[Unit] = []
        for name, location, description in project_specs:
            project = Project(name=name, location=location, description=description)
            db.add(project)
            db.flush()

            for b_idx in range(1, random.randint(2, 3) + 1):
                building = Building(
                    project_id=project.id,
                    name=f"Block {chr(64 + b_idx)}",
                    description=f"Residential block {chr(64 + b_idx)} of {name}.",
                )
                db.add(building)
                db.flush()

                unit_count = random.randint(6, 10)
                for u_idx in range(1, unit_count + 1):
                    unit_type = random.choice(list(UnitType))
                    low, high = unit_prices[unit_type]
                    unit = Unit(
                        building_id=building.id,
                        unit_number=f"{chr(64 + b_idx)}-{100 + u_idx}",
                        unit_type=unit_type,
                        price=Decimal(random.randrange(low, high, 50000)),
                        status=UnitStatus.AVAILABLE,
                    )
                    db.add(unit)
                    all_units.append(unit)
        db.commit()
        print(f"  {len(all_units)} units created across {len(project_specs)} projects.")

        print("Creating leads...")
        stages = list(LeadStage)
        sources = list(LeadSource)
        leads: list[Lead] = []
        today = date.today()
        for i in range(20):
            stage = random.choices(
                stages, weights=[5, 4, 3, 3, 2, 2, 2], k=1
            )[0]
            # Follow-up spread: some overdue, some today, some future, some none.
            follow_up_choice = random.random()
            if stage in (LeadStage.BOOKED, LeadStage.LOST):
                next_follow_up = None
            elif follow_up_choice < 0.2:
                next_follow_up = today - timedelta(days=random.randint(1, 5))  # overdue
            elif follow_up_choice < 0.35:
                next_follow_up = today  # today
            elif follow_up_choice < 0.5:
                next_follow_up = today + timedelta(days=1)  # tomorrow
            elif follow_up_choice < 0.85:
                next_follow_up = today + timedelta(days=random.randint(2, 14))
            else:
                next_follow_up = None

            lead = Lead(
                name=random_name(),
                email=f"lead{i+1}@leadmail.io",
                phone=random_phone(),
                source=random.choice(sources),
                stage=stage,
                assigned_to=random.choice(employees).id,
                next_follow_up=next_follow_up,
            )
            db.add(lead)
            leads.append(lead)
        db.commit()

        print("Adding lead notes...")
        note_templates = [
            "Called and discussed budget expectations.",
            "Site visit scheduled for the weekend.",
            "Very interested in 2 BHK units, comparing with competitor project.",
            "Requested brochure and price list via email.",
            "Following up after site visit, positive feedback.",
            "Negotiating on price, awaiting management approval.",
        ]
        for lead in leads:
            for _ in range(random.randint(1, 3)):
                note = LeadNote(
                    lead_id=lead.id,
                    created_by=lead.assigned_to,
                    content=random.choice(note_templates),
                )
                db.add(note)
        db.commit()

        print("Creating bookings for BOOKED leads...")
        booked_leads = [lead for lead in leads if lead.stage == LeadStage.BOOKED]
        available_units = [u for u in all_units if u.status == UnitStatus.AVAILABLE]
        random.shuffle(available_units)

        for lead, unit in zip(booked_leads, available_units):
            booking = Booking(
                lead_id=lead.id,
                unit_id=unit.id,
                booked_by=lead.assigned_to,
                booking_date=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30)),
                status=BookingStatus.CONFIRMED,
            )
            unit.status = UnitStatus.BOOKED
            db.add(booking)
        db.commit()

        # Also book a couple of units that aren't tied to a BOOKED lead's stage,
        # to demonstrate a healthy mix of available/booked units on the dashboard.
        remaining_available = [u for u in all_units if u.status == UnitStatus.AVAILABLE]
        for unit in random.sample(remaining_available, k=min(3, len(remaining_available))):
            filler_lead = Lead(
                name=random_name(),
                email=None,
                phone=random_phone(),
                source=random.choice(sources),
                stage=LeadStage.BOOKED,
                assigned_to=random.choice(employees).id,
                next_follow_up=None,
            )
            db.add(filler_lead)
            db.flush()
            booking = Booking(
                lead_id=filler_lead.id,
                unit_id=unit.id,
                booked_by=filler_lead.assigned_to,
                booking_date=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60)),
                status=BookingStatus.CONFIRMED,
            )
            unit.status = UnitStatus.BOOKED
            db.add(booking)
        db.commit()

        total_bookings = db.query(Booking).count()
        total_units = db.query(Unit).count()
        total_leads = db.query(Lead).count()
        print(f"Done. {total_leads} leads, {total_units} units, {total_bookings} bookings seeded.")
        print("\nDemo credentials:")
        print("  Admin:          admin@realestatecrm.io / Admin@123")
        print("  Sales Employee: rahul@realestatecrm.io / Sales@123")
        print("  Sales Employee: priya@realestatecrm.io / Sales@123")
    finally:
        db.close()


if __name__ == "__main__":
    run()
