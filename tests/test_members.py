from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException

from app.api.routes import members as members_route
from app.api.deps import require_auth


class FakeUser:
    def __init__(self, user_id, email="user@example.com"):
        self.id = user_id
        self.email = email
        self.full_name = "Test User"
        self.position = "Engineer"


class FakeMember:
    def __init__(self, member_id, knowledge_base_id, user, role):
        self.id = member_id
        self.knowledge_base_id = knowledge_base_id
        self.user_id = user.id
        self.user = user
        self.role = role
        self.created_at = datetime.now(timezone.utc)


class FakeMemberRepo:
    def __init__(self):
        self.members = []

    def list_by_kb(self, knowledge_base_id):
        return [m for m in self.members if m.knowledge_base_id == knowledge_base_id]

    def get_role(self, knowledge_base_id, user_id):
        member = self.find_by_user(knowledge_base_id, user_id)
        return member.role if member else None

    def find_by_user(self, knowledge_base_id, user_id):
        for member in self.members:
            if member.knowledge_base_id == knowledge_base_id and member.user_id == user_id:
                return member
        return None

    def create_member(self, knowledge_base_id, user_id, role):
        user = FakeUser(user_id)
        member = FakeMember(uuid4(), knowledge_base_id, user, role)
        self.members.append(member)
        return member

    def get_member(self, member_id):
        return next((m for m in self.members if m.id == member_id), None)

    def update_role(self, member, role):
        member.role = role
        return member

    def delete_member(self, member):
        self.members = [m for m in self.members if m.id != member.id]

    def count_owners(self, knowledge_base_id):
        return len([m for m in self.members if m.knowledge_base_id == knowledge_base_id and m.role == "owner"])


def test_owner_can_add_member(client, monkeypatch):
    kb_id = uuid4()
    owner_id = uuid4()
    owner = FakeUser(owner_id, "owner@example.com")
    repo = FakeMemberRepo()
    repo.members.append(FakeMember(uuid4(), kb_id, owner, "owner"))

    client.app.dependency_overrides[members_route.get_member_repo] = lambda: repo
    client.app.dependency_overrides[members_route.get_db] = lambda: None
    client.app.dependency_overrides[require_auth] = lambda: owner
    monkeypatch.setattr(members_route, "resolve_user", lambda *args, **kwargs: FakeUser(uuid4(), "new@example.com"))
    monkeypatch.setattr(members_route, "require_kb_access", lambda *args, **kwargs: None)

    response = client.post(
        f"/api/v1/knowledge-bases/{kb_id}/members",
        json={"email": "new@example.com", "role": "member"},
    )

    assert response.status_code == 201


def test_member_cannot_add_member(client, monkeypatch):
    kb_id = uuid4()
    member_id = uuid4()
    member = FakeUser(member_id, "member@example.com")
    repo = FakeMemberRepo()
    repo.members.append(FakeMember(uuid4(), kb_id, member, "member"))

    client.app.dependency_overrides[members_route.get_member_repo] = lambda: repo
    client.app.dependency_overrides[members_route.get_db] = lambda: None
    client.app.dependency_overrides[require_auth] = lambda: member
    monkeypatch.setattr(members_route, "resolve_user", lambda *args, **kwargs: FakeUser(uuid4(), "new@example.com"))
    monkeypatch.setattr(members_route, "require_kb_access", lambda *args, **kwargs: None)

    response = client.post(
        f"/api/v1/knowledge-bases/{kb_id}/members",
        json={"email": "new@example.com", "role": "member"},
    )

    assert response.status_code == 403


def test_unauthorized_user_cannot_list_members(client, monkeypatch):
    kb_id = uuid4()
    monkeypatch.setattr(
        members_route,
        "require_kb_access",
        lambda *args, **kwargs: (_ for _ in ()).throw(HTTPException(status_code=403, detail="Access denied")),
    )
    response = client.get(f"/api/v1/knowledge-bases/{kb_id}/members", headers={"X-API-Key": "test-key"})
    assert response.status_code == 403


def test_role_update_restrictions(client, monkeypatch):
    kb_id = uuid4()
    owner_id = uuid4()
    admin_id = uuid4()
    owner = FakeUser(owner_id, "owner@example.com")
    admin = FakeUser(admin_id, "admin@example.com")
    repo = FakeMemberRepo()
    owner_member = FakeMember(uuid4(), kb_id, owner, "owner")
    admin_member = FakeMember(uuid4(), kb_id, admin, "admin")
    repo.members.extend([owner_member, admin_member])

    client.app.dependency_overrides[members_route.get_member_repo] = lambda: repo
    client.app.dependency_overrides[members_route.get_db] = lambda: None
    client.app.dependency_overrides[require_auth] = lambda: admin
    monkeypatch.setattr(members_route, "require_kb_access", lambda *args, **kwargs: None)

    response = client.patch(
        f"/api/v1/knowledge-bases/{kb_id}/members/{owner_member.id}",
        json={"role": "member"},
    )

    assert response.status_code == 403
