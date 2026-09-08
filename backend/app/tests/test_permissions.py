from app.tests.conftest import auth_headers


def test_sales_employee_cannot_list_users(client, sales_user):
    headers = auth_headers(client, "sales1@test.io", "Sales@123")
    resp = client.get("/api/users", headers=headers)
    assert resp.status_code == 403


def test_admin_can_list_users(client, admin_user, sales_user):
    headers = auth_headers(client, "admin@test.io", "Admin@123")
    resp = client.get("/api/users", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


def test_sales_employee_cannot_update_project(client, sales_user):
    headers = auth_headers(client, "sales1@test.io", "Sales@123")
    resp = client.put("/api/projects/1", headers=headers, json={"name": "Hacked"})
    assert resp.status_code == 403


def test_sales_employee_cannot_create_unit(client, sales_user, project_building_unit):
    headers = auth_headers(client, "sales1@test.io", "Sales@123")
    _, building, _ = project_building_unit
    resp = client.post(
        f"/api/buildings/{building.id}/units",
        headers=headers,
        json={"unit_number": "Z-999", "unit_type": "VILLA", "price": "10000000"},
    )
    assert resp.status_code == 403


def test_sales_employee_can_view_properties_and_units(client, sales_user, project_building_unit):
    headers = auth_headers(client, "sales1@test.io", "Sales@123")
    resp = client.get("/api/projects", headers=headers)
    assert resp.status_code == 200


def test_sales_employee_can_create_and_view_own_bookings(client, sales_user, sample_lead, project_building_unit):
    headers = auth_headers(client, "sales1@test.io", "Sales@123")
    _, _, unit = project_building_unit
    resp = client.post("/api/bookings", headers=headers, json={"lead_id": sample_lead.id, "unit_id": unit.id})
    assert resp.status_code == 201

    resp = client.get("/api/bookings", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_only_admin_can_delete_leads(client, sales_user, sample_lead):
    headers = auth_headers(client, "sales1@test.io", "Sales@123")
    resp = client.delete(f"/api/leads/{sample_lead.id}", headers=headers)
    assert resp.status_code == 403
