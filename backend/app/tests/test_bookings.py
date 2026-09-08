import threading

from app.models.lead import Lead, LeadSource, LeadStage
from app.tests.conftest import TestingSessionLocal, auth_headers


def test_booking_succeeds_for_available_unit(client, admin_user, sample_lead, project_building_unit):
    headers = auth_headers(client, "admin@test.io", "Admin@123")
    _, _, unit = project_building_unit

    resp = client.post("/api/bookings", headers=headers, json={"lead_id": sample_lead.id, "unit_id": unit.id})
    assert resp.status_code == 201
    body = resp.json()
    assert body["unit_id"] == unit.id
    assert body["status"] == "CONFIRMED"

    # Side effects: unit becomes booked, lead moves to BOOKED stage.
    unit_resp = client.get(f"/api/units/{unit.id}", headers=headers)
    assert unit_resp.json()["status"] == "BOOKED"

    lead_resp = client.get(f"/api/leads/{sample_lead.id}", headers=headers)
    assert lead_resp.json()["stage"] == "BOOKED"


def test_booking_rejected_for_already_booked_unit(client, admin_user, sample_lead, project_building_unit):
    headers = auth_headers(client, "admin@test.io", "Admin@123")
    _, _, unit = project_building_unit

    first = client.post("/api/bookings", headers=headers, json={"lead_id": sample_lead.id, "unit_id": unit.id})
    assert first.status_code == 201

    # Create a second lead to attempt booking the now-unavailable unit.
    db = TestingSessionLocal()
    second_lead = Lead(name="Second Lead", phone="9111111111", source=LeadSource.WEBSITE, stage=LeadStage.NEW)
    db.add(second_lead)
    db.commit()
    db.refresh(second_lead)
    second_lead_id = second_lead.id
    db.close()

    second = client.post(
        "/api/bookings", headers=headers, json={"lead_id": second_lead_id, "unit_id": unit.id}
    )
    assert second.status_code == 409
    assert "no longer available" in second.json()["detail"]


def test_booking_rejected_for_invalid_lead(client, admin_user, project_building_unit):
    headers = auth_headers(client, "admin@test.io", "Admin@123")
    _, _, unit = project_building_unit
    resp = client.post("/api/bookings", headers=headers, json={"lead_id": 999999, "unit_id": unit.id})
    assert resp.status_code == 404


def test_booking_rejected_for_invalid_unit(client, admin_user, sample_lead):
    headers = auth_headers(client, "admin@test.io", "Admin@123")
    resp = client.post("/api/bookings", headers=headers, json={"lead_id": sample_lead.id, "unit_id": 999999})
    assert resp.status_code == 404


def test_concurrent_double_booking_is_prevented(client, admin_user, project_building_unit):
    """
    THE MOST IMPORTANT TEST IN THIS SUITE.

    Fires N genuinely concurrent booking requests at the same unit from
    separate threads (each with its own DB session, via the app's normal
    connection pool) and asserts that exactly one succeeds and all others
    are rejected with 409 -- proving the unit can never be double-booked.
    """
    _, _, unit = project_building_unit
    headers = auth_headers(client, "admin@test.io", "Admin@123")

    # Create N distinct leads to book against the same unit.
    db = TestingSessionLocal()
    lead_ids = []
    for i in range(8):
        lead = Lead(name=f"Concurrent Lead {i}", phone=f"90000000{i:02d}", source=LeadSource.WEBSITE, stage=LeadStage.NEW)
        db.add(lead)
        db.flush()
        lead_ids.append(lead.id)
    db.commit()
    db.close()

    results: list[int] = [None] * len(lead_ids)

    def attempt_booking(idx: int, lead_id: int) -> None:
        resp = client.post("/api/bookings", headers=headers, json={"lead_id": lead_id, "unit_id": unit.id})
        results[idx] = resp.status_code

    threads = [threading.Thread(target=attempt_booking, args=(i, lid)) for i, lid in enumerate(lead_ids)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    successes = results.count(201)
    conflicts = results.count(409)

    assert successes == 1, f"Expected exactly 1 successful booking, got {successes}. Results: {results}"
    assert conflicts == len(lead_ids) - 1, f"Expected {len(lead_ids) - 1} conflicts, got {conflicts}"

    # Final DB state must reflect exactly one booking for this unit.
    unit_resp = client.get(f"/api/units/{unit.id}", headers=headers)
    assert unit_resp.json()["status"] == "BOOKED"

    bookings_resp = client.get("/api/bookings", headers=headers)
    bookings_for_unit = [b for b in bookings_resp.json() if b["unit_id"] == unit.id]
    assert len(bookings_for_unit) == 1
