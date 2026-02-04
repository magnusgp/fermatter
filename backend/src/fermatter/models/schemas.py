"""Pydantic schemas for API request/response validation."""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ObservationType(str, Enum):
    """Types of observations the analyzer can produce."""

    MISSING_EVIDENCE = "missing_evidence"
    UNCLEAR_CLAIM = "unclear_claim"
    LOGIC_GAP = "logic_gap"
    STRUCTURE = "structure"
    INSTABILITY = "instability"


class Snapshot(BaseModel):
    """A snapshot of the text at a point in time."""

    ts: str = Field(..., description="ISO8601 timestamp")
    text: str = Field(..., description="Text content at snapshot time")


class AnalyzeRequest(BaseModel):
    """Request body for the /analyze endpoint."""

    text: str = Field(..., description="Current text to analyze")
    snapshots: list[Snapshot] = Field(
        default_factory=list, description="Historical snapshots for instability analysis"
    )
    goal: Optional[str] = Field(None, description="Optional writing goal")


class Observation(BaseModel):
    """A single observation/feedback item."""

    id: str = Field(..., description="Unique observation ID")
    type: ObservationType = Field(..., description="Type of observation")
    severity: int = Field(..., ge=1, le=3, description="Severity level 1-3")
    paragraph: int = Field(..., ge=0, description="Zero-indexed paragraph number")
    title: str = Field(..., description="Short title")
    note: str = Field(..., description="Detailed explanation")
    question: str = Field(..., description="Guiding question for the writer")


class UnstableParagraph(BaseModel):
    """Information about an unstable (frequently rewritten) paragraph."""

    paragraph: int = Field(..., ge=0, description="Zero-indexed paragraph number")
    rewrite_count: int = Field(..., ge=0, description="Number of rewrites detected")
    note: str = Field(..., description="Note about the instability")


class Meta(BaseModel):
    """Metadata about the analysis."""

    paragraph_count: int = Field(..., ge=0, description="Total number of paragraphs")


class AnalyzeResponse(BaseModel):
    """Response body for the /analyze endpoint."""

    observations: list[Observation] = Field(
        default_factory=list, description="List of observations"
    )
    unstable: list[UnstableParagraph] = Field(
        default_factory=list, description="List of unstable paragraphs"
    )
    meta: Meta = Field(..., description="Analysis metadata")
