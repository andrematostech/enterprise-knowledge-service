
def test_unauthorized(client):
    response = client.get("/api/v1/knowledge-bases")
    assert response.status_code == 401
