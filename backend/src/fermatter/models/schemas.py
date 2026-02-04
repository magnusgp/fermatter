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
    TONE = "tone"
    PRECISION = "precision"
    CITATION_NEEDED = "citation_needed"


class AnalysisMode(str, Enum):
    """Writing analysis modes that adjust feedback tone."""

    SCIENTIFIC = "scientific"
    JOURNALIST = "journalist"
    GRANDMA = "grandma"


class ScopeType(str, Enum):
    """Type of analysis scope."""

    DOCUMENT = "document"
    SELECTION = "selection"


class Snapshot(BaseModel):
    """A snapshot of the text at a point in time."""

    ts: str = Field(..., description="ISO8601 timestamp")
    text: str = Field(..., description="Text content at snapshot time")


class SourcesInput(BaseModel):
    """Sources configuration for analysis."""

    user: list[str] = Field(
        default_factory=list, description="User-provided URLs or citation strings"
    )
    library_ids: list[str] = Field(
        default_factory=list, description="Selected demo source IDs (e.g., S1, S2)"
    )


class AnalysisScope(BaseModel):
    """Scope of the analysis (full document or selection)."""

    type: ScopeType = Field(
        default=ScopeType.DOCUMENT, description="Analysis scope type"
    )
    paragraphs: list[int] = Field(
        default_factory=list, description="Analyze only these paragraph indices"
    )
    selection_text: Optional[str] = Field(
        None, description="Text selection to analyze"
    )


class AnalyzeRequest(BaseModel):
    """Request body for the /analyze endpoint."""

    text: str = Field(..., description="Current text to analyze")
    snapshots: list[Snapshot] = Field(
        default_factory=list,
        description="Historical snapshots for instability analysis",
    )
    goal: Optional[str] = Field(None, description="Optional writing goal")
    mode: AnalysisMode = Field(
        default=AnalysisMode.SCIENTIFIC, description="Analysis mode/tone"
    )
    sources: SourcesInput = Field(
        default_factory=SourcesInput, description="Sources for citation"
    )
    scope: AnalysisScope = Field(
        default_factory=AnalysisScope, description="Analysis scope"
    )


class Observation(BaseModel):
    """A single observation/feedback item."""

    id: str = Field(..., description="Unique observation ID")
    type: ObservationType = Field(..., description="Type of observation")
    severity: int = Field(..., ge=1, le=5, description="Severity level 1-5")
    paragraph: int = Field(..., ge=0, description="Zero-indexed paragraph number")
    anchor_text: Optional[str] = Field(
        None, description="Short quoted fragment used as anchor"
    )
    title: str = Field(..., description="Short title")
    note: str = Field(..., description="Detailed explanation")
    question: str = Field(..., description="Guiding question for the writer")
    source_ids: list[str] = Field(
        default_factory=list, description="Referenced source IDs"
    )


class UnstableParagraph(BaseModel):
    """Information about an unstable (frequently rewritten) paragraph."""

    paragraph: int = Field(..., ge=0, description="Zero-indexed paragraph number")
    rewrite_count: int = Field(..., ge=0, description="Number of rewrites detected")
    note: str = Field(..., description="Note about the instability")


class SourceUsed(BaseModel):
    """A source that was used/cited in the analysis."""

    id: str = Field(..., description="Source ID (e.g., S1)")
    title: str = Field(..., description="Source title")
    url: str = Field(..., description="Source URL")


class Meta(BaseModel):
    """Metadata about the analysis."""

    paragraph_count: int = Field(..., ge=0, description="Total number of paragraphs")
    latency_ms: int = Field(default=0, ge=0, description="Analysis latency in ms")
    used_llm: bool = Field(default=False, description="Whether LLM was used")
    warning: Optional[str] = Field(
        default=None, description="Warning message if LLM analysis failed"
    )


class AnalyzeResponse(BaseModel):
    """Response body for the /analyze endpoint."""

    observations: list[Observation] = Field(
        default_factory=list, description="List of observations"
    )
    unstable: list[UnstableParagraph] = Field(
        default_factory=list, description="List of unstable paragraphs"
    )
    sources_used: list[SourceUsed] = Field(
        default_factory=list, description="Sources cited in the analysis"
    )
    meta: Meta = Field(..., description="Analysis metadata")


# Library source model for GET /sources endpoint
class LibrarySource(BaseModel):
    """A source from the demo library."""

    id: str = Field(..., description="Source ID (e.g., S1)")
    title: str = Field(..., description="Source title")
    url: str = Field(..., description="Source URL")
    snippet: str = Field(..., description="Short excerpt from the source")


class SourcesLibraryResponse(BaseModel):
    """Response for GET /sources endpoint."""

    sources: list[LibrarySource] = Field(..., description="Available library sources")
