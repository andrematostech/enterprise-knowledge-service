from uuid import uuid4

from app.api.routes import messages as messages_route
from app.api.deps import get_current_user_from_jwt
from app.models.user import User


class FakeDB:
    pass


def test_broadcast_requires_admin(client):
    user = User(id=uuid4(), email="member@example.com", hashed_password="x", is_admin=False, is_active=True)
    client.app.dependency_overrides[get_current_user_from_jwt] = lambda: user
    client.app.dependency_overrides[messages_route.get_db] = lambda: FakeDB()

    response = client.post(
        "/api/v1/messages",
        json={"scope": "broadcast", "subject": "Notice", "body": "Test"},
    )

    assert response.status_code == 403
