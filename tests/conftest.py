import os

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def client() -> TestClient:
    os.environ["API_KEY"] = "test-key"
    app = create_app()
    return TestClient(app)
