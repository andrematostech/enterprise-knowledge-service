import os

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def app():
    os.environ["API_KEY"] = "test-key"
    return create_app()


@pytest.fixture
def client(app) -> TestClient:
    return TestClient(app)
