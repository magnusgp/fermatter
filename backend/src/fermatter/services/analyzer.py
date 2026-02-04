"""Text analysis service.

This module contains the core analysis logic. Supports both
deterministic heuristics and LLM-based analysis.
"""

import asyncio
import hashlib
import re
import time
import uuid
from typing import Optional

from fermatter.core.config import settings
from fermatter.models.schemas import (
    AnalysisMode,
    AnalysisScope,
    AnalyzeResponse,
    Meta,
    Observation,
    ObservationType,
    ScopeType,
    Snapshot,
    SourcesInput,
    SourceUsed,
    UnstableParagraph,
)
from fermatter.services.openai_client import call_openai_analysis
from fermatter.services.sources_library import (
    format_sources_for_prompt,
    get_source_by_id,
)


def compute_paragraphs(text: str) -> list[str]:
    """Split text into paragraphs.

    Paragraphs are separated by one or more blank lines.

    Args:
        text: The input text.

    Returns:
        List of paragraph strings (may include empty strings for blank lines).
    """
    # Split on double newlines, filter out empty results
    paragraphs = re.split(r"\n\s*\n", text.strip())
    return [p.strip() for p in paragraphs if p.strip()]


def hash_paragraph(paragraph: str) -> str:
    """Compute a hash for a paragraph.

    Args:
        paragraph: The paragraph text.

    Returns:
        SHA-256 hash of the normalized paragraph.
    """
    # Normalize whitespace before hashing
    normalized = " ".join(paragraph.split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]


def compute_instability(snapshots: list[Snapshot]) -> dict[int, int]:
    """Compute rewrite counts per paragraph from snapshots.

    Compares consecutive snapshots and counts how many times
    each paragraph position has changed.

    Args:
        snapshots: List of text snapshots ordered by time.

    Returns:
        Dictionary mapping paragraph index to rewrite count.
    """
    if len(snapshots) < 2:
        return {}

    rewrite_counts: dict[int, int] = {}

    for i in range(1, len(snapshots)):
        prev_paragraphs = compute_paragraphs(snapshots[i - 1].text)
        curr_paragraphs = compute_paragraphs(snapshots[i].text)

        prev_hashes = [hash_paragraph(p) for p in prev_paragraphs]
        curr_hashes = [hash_paragraph(p) for p in curr_paragraphs]

        # Compare hashes at each position
        max_len = max(len(prev_hashes), len(curr_hashes))
        for idx in range(max_len):
            prev_hash = prev_hashes[idx] if idx < len(prev_hashes) else None
            curr_hash = curr_hashes[idx] if idx < len(curr_hashes) else None

            if prev_hash != curr_hash:
                rewrite_counts[idx] = rewrite_counts.get(idx, 0) + 1

    return rewrite_counts


def _generate_id() -> str:
    """Generate a unique observation ID."""
    return str(uuid.uuid4())[:8]


def _check_long_paragraphs(paragraphs: list[str]) -> list[Observation]:
    """Check for paragraphs that are too long."""
    observations = []
    for idx, para in enumerate(paragraphs):
        word_count = len(para.split())
        if word_count > 150:
            # Extract anchor text (first few words)
            words = para.split()[:6]
            anchor = " ".join(words) + "..."
            observations.append(
                Observation(
                    id=_generate_id(),
                    type=ObservationType.STRUCTURE,
                    severity=3,
                    paragraph=idx,
                    anchor_text=anchor,
                    title="Long paragraph",
                    note=f"This paragraph has {word_count} words. Consider breaking it into smaller chunks for readability.",
                    question="Could this paragraph be split into more focused sections?",
                    source_ids=[],
                )
            )
    return observations


def _check_missing_evidence(paragraphs: list[str]) -> list[Observation]:
    """Check for claims that might lack supporting evidence."""
    observations = []
    evidence_keywords = [
        "because",
        "since",
        "therefore",
        "research shows",
        "according to",
        "study",
        "evidence",
        "data",
        "found that",
    ]

    claim_patterns = [
        r"\b(clearly|obviously|everyone knows|it is known)\b",
        r"\b(always|never|all|none|every)\b.*\b(are|is|will|do)\b",
    ]

    for idx, para in enumerate(paragraphs):
        para_lower = para.lower()

        # Check if paragraph has claim patterns but lacks evidence keywords
        has_claim = any(re.search(pattern, para_lower) for pattern in claim_patterns)
        has_evidence = any(keyword in para_lower for keyword in evidence_keywords)

        if has_claim and not has_evidence:
            # Find the claim phrase for anchor
            anchor = None
            for pattern in claim_patterns:
                match = re.search(pattern, para_lower)
                if match:
                    start = max(0, match.start() - 10)
                    end = min(len(para), match.end() + 20)
                    anchor = para[start:end].strip()
                    break

            observations.append(
                Observation(
                    id=_generate_id(),
                    type=ObservationType.MISSING_EVIDENCE,
                    severity=3,
                    paragraph=idx,
                    anchor_text=anchor,
                    title="Unsupported claim",
                    note="This paragraph contains strong claims without apparent supporting evidence.",
                    question="What evidence or reasoning supports this claim?",
                    source_ids=[],
                )
            )

    return observations


def _check_unclear_claims(paragraphs: list[str]) -> list[Observation]:
    """Check for vague or unclear statements."""
    observations = []
    vague_patterns = [
        (r"\b(things|stuff|something|somehow|somewhat)\b", "vague noun"),
        (r"\b(very|really|quite|rather)\s+(good|bad|important|interesting)\b", "vague modifier"),
        (r"\b(etc|and so on|and so forth)\b", "trailing vagueness"),
    ]

    for idx, para in enumerate(paragraphs):
        para_lower = para.lower()
        for pattern, reason in vague_patterns:
            match = re.search(pattern, para_lower)
            if match:
                # Get anchor around the match
                start = max(0, match.start() - 5)
                end = min(len(para), match.end() + 15)
                anchor = para[start:end].strip()

                observations.append(
                    Observation(
                        id=_generate_id(),
                        type=ObservationType.UNCLEAR_CLAIM,
                        severity=2,
                        paragraph=idx,
                        anchor_text=anchor,
                        title="Vague language",
                        note=f"This paragraph contains vague language ({reason}) that could be more specific.",
                        question="Can you be more specific about what you mean here?",
                        source_ids=[],
                    )
                )
                break  # Only one observation per paragraph for this check

    return observations


def _run_heuristic_analysis(paragraphs: list[str]) -> list[Observation]:
    """Run all heuristic checks and return observations."""
    observations: list[Observation] = []
    observations.extend(_check_long_paragraphs(paragraphs))
    observations.extend(_check_missing_evidence(paragraphs))
    observations.extend(_check_unclear_claims(paragraphs))
    return observations


def _compute_instability_observations(
    rewrite_counts: dict[int, int],
) -> tuple[list[Observation], list[UnstableParagraph]]:
    """Convert rewrite counts to observations and unstable paragraph info."""
    observations: list[Observation] = []
    unstable: list[UnstableParagraph] = []

    for para_idx, count in rewrite_counts.items():
        if count >= 2:  # Threshold for "unstable"
            observations.append(
                Observation(
                    id=_generate_id(),
                    type=ObservationType.INSTABILITY,
                    severity=2 if count < 4 else 3,
                    paragraph=para_idx,
                    anchor_text=None,
                    title="Frequently rewritten",
                    note=f"This paragraph has been rewritten {count} times.",
                    question="Are you struggling to express this idea clearly?",
                    source_ids=[],
                )
            )
            unstable.append(
                UnstableParagraph(
                    paragraph=para_idx,
                    rewrite_count=count,
                    note=f"Rewritten {count} times across snapshots",
                )
            )

    return observations, unstable


def _collect_sources_used(
    observations: list[Observation],
    sources_input: SourcesInput,
) -> list[SourceUsed]:
    """Collect all sources that were actually cited in observations."""
    cited_ids: set[str] = set()
    for obs in observations:
        cited_ids.update(obs.source_ids)

    sources_used: list[SourceUsed] = []
    for sid in cited_ids:
        if sid.startswith("S"):
            source = get_source_by_id(sid)
            if source:
                sources_used.append(
                    SourceUsed(id=source.id, title=source.title, url=source.url)
                )
        elif sid.startswith("U"):
            # User-provided source
            try:
                idx = int(sid[1:]) - 1
                if 0 <= idx < len(sources_input.user):
                    user_src = sources_input.user[idx]
                    sources_used.append(
                        SourceUsed(id=sid, title="User source", url=user_src)
                    )
            except ValueError:
                pass

    return sources_used


async def analyze_async(
    text: str,
    snapshots: Optional[list[Snapshot]] = None,
    goal: Optional[str] = None,
    mode: AnalysisMode = AnalysisMode.SCIENTIFIC,
    sources: Optional[SourcesInput] = None,
    scope: Optional[AnalysisScope] = None,
) -> AnalyzeResponse:
    """Analyze text and return structured feedback (async version).

    This is the main entry point for text analysis. Uses LLM if configured,
    falls back to heuristics otherwise.

    Args:
        text: The current text to analyze.
        snapshots: Historical snapshots for instability analysis.
        goal: Optional writing goal.
        mode: Analysis mode/tone.
        sources: Sources configuration for citations.
        scope: Analysis scope (document or selection).

    Returns:
        AnalyzeResponse with observations, instability info, and metadata.
    """
    start_time = time.time()
    snapshots = snapshots or []
    sources = sources or SourcesInput()
    scope = scope or AnalysisScope()

    # Determine what text to analyze
    if scope.type == ScopeType.SELECTION and scope.selection_text:
        analyze_text = scope.selection_text
        paragraphs = compute_paragraphs(analyze_text)
        is_selection = True
    else:
        analyze_text = text
        paragraphs = compute_paragraphs(text)
        is_selection = False

        # Filter to specific paragraphs if requested
        if scope.paragraphs:
            paragraphs = [
                paragraphs[i] for i in scope.paragraphs if i < len(paragraphs)
            ]

    observations: list[Observation] = []
    used_llm = False
    warning: str | None = None

    # Try LLM analysis if enabled
    if settings.use_llm and settings.openai_api_key:
        sources_context = format_sources_for_prompt(
            sources.library_ids, sources.user
        )
        llm_observations, success, error_msg = await call_openai_analysis(
            text=analyze_text,
            mode=mode,
            sources_context=sources_context,
            paragraphs=paragraphs,
            is_selection=is_selection,
        )
        if success:
            observations = llm_observations
            used_llm = True
        elif error_msg:
            warning = f"AI analysis failed: {error_msg}. Using basic analysis instead."

    # Fall back to heuristics if LLM didn't work
    if not used_llm:
        observations = _run_heuristic_analysis(paragraphs)

    # Always compute instability from snapshots (for full document only)
    unstable: list[UnstableParagraph] = []
    if not is_selection:
        rewrite_counts = compute_instability(snapshots)
        instability_obs, unstable = _compute_instability_observations(rewrite_counts)
        observations.extend(instability_obs)

    # Collect sources that were actually cited
    sources_used = _collect_sources_used(observations, sources)

    # Calculate latency
    latency_ms = int((time.time() - start_time) * 1000)

    return AnalyzeResponse(
        observations=observations,
        unstable=unstable,
        sources_used=sources_used,
        meta=Meta(
            paragraph_count=len(paragraphs),
            latency_ms=latency_ms,
            used_llm=used_llm,
            warning=warning,
        ),
    )


def analyze(
    text: str,
    snapshots: Optional[list[Snapshot]] = None,
    goal: Optional[str] = None,
    mode: AnalysisMode = AnalysisMode.SCIENTIFIC,
    sources: Optional[SourcesInput] = None,
    scope: Optional[AnalysisScope] = None,
) -> AnalyzeResponse:
    """Analyze text and return structured feedback (sync wrapper).

    Wraps the async version for use in sync contexts.
    """
    return asyncio.run(
        analyze_async(
            text=text,
            snapshots=snapshots,
            goal=goal,
            mode=mode,
            sources=sources,
            scope=scope,
        )
    )
