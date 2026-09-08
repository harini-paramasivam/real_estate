from app.tests.conftest import auth_headers


def test_create_project(client, admin_user):
    headers = auth_headers(client, "admin@test.io", "Admin@123")
    resp = client.post("/api/projects", headers=headers, json={"name": "Sunrise Towers", "location": "Chennai"})
    assert resp.status_code == 201
    assert resp.json()["name"] == "Sunrise Towers"


def test_sales_employee_cannot_create_project(client, sales_user):
    headers = auth_headers(client, "sales1@test.io", "Sales@123")
    resp = client.post("/api/projects", headers=headers, json={"name": "Sunrise Towers", "location": "Chennai"})
    assert resp.status_code == 403


def test_create_building_under_valid_project(client, admin_user):
    headers = auth_headers(client, "admin@test.io", "Admin@123")
    project_resp = client.post("/api/projects", headers=headers, json={"name": "P1", "location": "Chennai"})
    project_id = project_resp.json()["id"]

    resp = client.post(f"/api/projects/{project_id}/buildings", headers=headers, json={"name": "Block A"})
    assert resp.status_code == 201
    assert resp.json()["project_id"] == project_id


def test_create_building_under_invalid_project_404(client, admin_user):
    headers = auth_headers(client, "admin@test.io", "Admin@123")
    resp = client.post("/api/projects/9999/buildings", headers=headers, json={"name": "Block A"})
    assert resp.status_code == 404


def test_create_unit_under_valid_building(client, admin_user):
    headers = auth_headers(client, "admin@test.io", "Admin@123")
    project_id = client.post("/api/projects", headers=headers, json={"name": "P1", "location": "Chennai"}).json()["id"]
    building_id = client.post(
        f"/api/projects/{project_id}/buildings", headers=headers, json={"name": "Block A"}
    ).json()["id"]

    resp = client.post(
        f"/api/buildings/{building_id}/units",
        headers=headers,
        json={"unit_number": "A-101", "unit_type": "2_BHK", "price": "5500000"},
    )
    assert resp.status_code == 201
    assert resp.json()["status"] == "AVAILABLE"


def test_unit_number_must_be_unique_within_building(client, admin_user):
    headers = auth_headers(client, "admin@test.io", "Admin@123")
    project_id = client.post("/api/projects", headers=headers, json={"name": "P1", "location": "Chennai"}).json()["id"]
    building_id = client.post(
        f"/api/projects/{project_id}/buildings", headers=headers, json={"name": "Block A"}
    ).json()["id"]
    client.post(
        f"/api/buildings/{building_id}/units",
        headers=headers,
        json={"unit_number": "A-101", "unit_type": "2_BHK", "price": "5500000"},
    )
    resp = client.post(
        f"/api/buildings/{building_id}/units",
        headers=headers,
        json={"unit_number": "A-101", "unit_type": "3_BHK", "price": "7500000"},
    )
    assert resp.status_code == 409


def test_unit_price_must_be_positive(client, admin_user):
    headers = auth_headers(client, "admin@test.io", "Admin@123")
    project_id = client.post("/api/projects", headers=headers, json={"name": "P1", "location": "Chennai"}).json()["id"]
    building_id = client.post(
        f"/api/projects/{project_id}/buildings", headers=headers, json={"name": "Block A"}
    ).json()["id"]
    resp = client.post(
        f"/api/buildings/{building_id}/units",
        headers=headers,
        json={"unit_number": "A-101", "unit_type": "2_BHK", "price": "-100"},
    )
    assert resp.status_code == 422


def test_retrieve_units_for_building(client, admin_user, project_building_unit):
    headers = auth_headers(client, "admin@test.io", "Admin@123")
    _, building, unit = project_building_unit
    resp = client.get(f"/api/buildings/{building.id}/units", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["id"] == unit.id
