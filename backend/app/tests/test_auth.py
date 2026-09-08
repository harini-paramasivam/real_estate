from app.tests.conftest import auth_headers


def test_valid_login(client, admin_user):
    resp = client.post("/api/auth/login", json={"email": "admin@test.io", "password": "Admin@123"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["access_token"]
    assert body["user"]["email"] == "admin@test.io"
    assert body["user"]["role"] == "ADMIN"


def test_invalid_login_wrong_password(client, admin_user):
    resp = client.post("/api/auth/login", json={"email": "admin@test.io", "password": "wrong-password"})
    assert resp.status_code == 401


def test_invalid_login_unknown_email(client):
    resp = client.post("/api/auth/login", json={"email": "nobody@test.io", "password": "whatever123"})
    assert resp.status_code == 401


def test_protected_endpoint_requires_token(client):
    resp = client.get("/api/leads")
    assert resp.status_code == 401


def test_protected_endpoint_rejects_garbage_token(client):
    resp = client.get("/api/leads", headers={"Authorization": "Bearer not-a-real-token"})
    assert resp.status_code == 401


def test_me_returns_current_user(client, sales_user):
    headers = auth_headers(client, "sales1@test.io", "Sales@123")
    resp = client.get("/api/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "sales1@test.io"
