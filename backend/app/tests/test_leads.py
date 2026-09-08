from app.tests.conftest import auth_headers


def test_create_lead_as_sales_employee(client, sales_user):
    headers = auth_headers(client, "sales1@test.io", "Sales@123")
    resp = client.post(
        "/api/leads",
        headers=headers,
        json={"name": "New Lead", "phone": "9123456789", "source": "WEBSITE"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "New Lead"
    assert body["stage"] == "NEW"
    # Sales employees can only create leads assigned to themselves.
    assert body["assigned_to"] == sales_user.id


def test_update_lead(client, sales_user, sample_lead):
    headers = auth_headers(client, "sales1@test.io", "Sales@123")
    resp = client.put(
        f"/api/leads/{sample_lead.id}",
        headers=headers,
        json={"stage": "CONTACTED"},
    )
    assert resp.status_code == 200
    assert resp.json()["stage"] == "CONTACTED"


def test_retrieve_lead(client, sales_user, sample_lead):
    headers = auth_headers(client, "sales1@test.io", "Sales@123")
    resp = client.get(f"/api/leads/{sample_lead.id}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == sample_lead.id


def test_search_and_filter_leads(client, sales_user, sample_lead):
    headers = auth_headers(client, "sales1@test.io", "Sales@123")
    resp = client.get("/api/leads?search=Test Lead", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

    resp = client.get("/api/leads?stage=NEW", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

    resp = client.get("/api/leads?stage=LOST", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 0


def test_sales_employee_cannot_view_another_employees_lead(client, sales_user, sales_user_2, sample_lead):
    # sample_lead is assigned to sales_user, not sales_user_2
    headers = auth_headers(client, "sales2@test.io", "Sales@123")
    resp = client.get(f"/api/leads/{sample_lead.id}", headers=headers)
    assert resp.status_code == 403


def test_sales_employee_cannot_edit_another_employees_lead(client, sales_user, sales_user_2, sample_lead):
    headers = auth_headers(client, "sales2@test.io", "Sales@123")
    resp = client.put(f"/api/leads/{sample_lead.id}", headers=headers, json={"stage": "LOST"})
    assert resp.status_code == 403


def test_admin_can_view_and_edit_any_lead(client, admin_user, sales_user, sample_lead):
    headers = auth_headers(client, "admin@test.io", "Admin@123")
    resp = client.get(f"/api/leads/{sample_lead.id}", headers=headers)
    assert resp.status_code == 200

    resp = client.put(f"/api/leads/{sample_lead.id}", headers=headers, json={"stage": "LOST"})
    assert resp.status_code == 200


def test_add_and_list_notes(client, sales_user, sample_lead):
    headers = auth_headers(client, "sales1@test.io", "Sales@123")
    resp = client.post(f"/api/leads/{sample_lead.id}/notes", headers=headers, json={"content": "Called customer"})
    assert resp.status_code == 201

    resp = client.get(f"/api/leads/{sample_lead.id}/notes", headers=headers)
    assert resp.status_code == 200
    notes = resp.json()
    assert len(notes) == 1
    assert notes[0]["content"] == "Called customer"


def test_follow_up_date_cannot_be_in_the_past(client, sales_user):
    headers = auth_headers(client, "sales1@test.io", "Sales@123")
    resp = client.post(
        "/api/leads",
        headers=headers,
        json={"name": "Bad Lead", "phone": "9123456780", "next_follow_up": "2000-01-01"},
    )
    assert resp.status_code == 422
