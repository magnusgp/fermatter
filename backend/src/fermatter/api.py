"""API routes for Fermatter."""

from fastapi import APIRouter

from fermatter.models.schemas import AnalyzeRequest, AnalyzeResponse
from fermatter.services.analyzer import analyze
from fermatter.utils.health import get_health_status

router = APIRouter()


@router.get("/health")
def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return get_health_status()


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_text(request: AnalyzeRequest) -> AnalyzeResponse:
    """Analyze text and return structured feedback."""
    return analyze(
        text=request.text,
        snapshots=request.snapshots,
        goal=request.goal,
    )
