"""Health check utilities."""


def get_health_status() -> dict[str, str]:
    """Return application health status.

    Returns:
        Dictionary with status information.
    """
    return {"status": "ok"}
