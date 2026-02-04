"""Tests for health endpoint and utilities."""

from fastapi.testclient import TestClient

from fermatter.main import app
from fermatter.utils.health import get_health_status


client = TestClient(app)


def test_health_status_function():
    """Test the health status utility function."""
    result = get_health_status()
    assert result == {"status": "ok"}


def test_health_endpoint():
    """Test the /health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_analyze_endpoint_basic():
    """Test the /analyze endpoint with basic input."""
    response = client.post(
        "/analyze",
        json={
            "text": "This is a simple paragraph.\n\nThis is another paragraph.",
            "snapshots": [],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "observations" in data
    assert "unstable" in data
    assert "meta" in data
    assert data["meta"]["paragraph_count"] == 2


def test_analyze_endpoint_with_long_paragraph():
    """Test that long paragraphs generate observations."""
    long_text = " ".join(["word"] * 200)
    response = client.post(
        "/analyze",
        json={"text": long_text, "snapshots": []},
    )
    assert response.status_code == 200
    data = response.json()

    # Should have at least one observation about long paragraph
    structure_observations = [
        obs for obs in data["observations"] if obs["type"] == "structure"
    ]
    assert len(structure_observations) >= 1
