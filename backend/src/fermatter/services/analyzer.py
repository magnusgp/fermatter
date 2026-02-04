"""Text analysis service.

This module contains the core analysis logic. Currently implements
deterministic heuristics. Structured to allow easy addition of
LLM-based analysis in the future.
"""

import hashlib
import re
import uuid
from typing import Optional

from fermatter.models.schemas import (
    AnalyzeResponse,
    Meta,
    Observation,
    ObservationType,
    Snapshot,
    UnstableParagraph,
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
            observations.append(
                Observation(
                    id=_generate_id(),
                    type=ObservationType.STRUCTURE,
                    severity=2,
                    paragraph=idx,
                    title="Long paragraph",
                    note=f"This paragraph has {word_count} words. Consider breaking it into smaller chunks for readability.",
                    question="Could this paragraph be split into more focused sections?",
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
            observations.append(
                Observation(
                    id=_generate_id(),
                    type=ObservationType.MISSING_EVIDENCE,
                    severity=2,
                    paragraph=idx,
                    title="Unsupported claim",
                    note="This paragraph contains strong claims without apparent supporting evidence.",
                    question="What evidence or reasoning supports this claim?",
                )
            )

    return observations


def _check_unclear_claims(paragraphs: list[str]) -> list[Observation]:
    """Check for vague or unclear statements."""
    observations = []
    vague_patterns = [
        r"\b(things|stuff|something|somehow|somewhat)\b",
        r"\b(very|really|quite|rather)\s+(good|bad|important|interesting)\b",
        r"\b(etc|and so on|and so forth)\b",
    ]

    for idx, para in enumerate(paragraphs):
        para_lower = para.lower()
        for pattern in vague_patterns:
            if re.search(pattern, para_lower):
                observations.append(
                    Observation(
                        id=_generate_id(),
                        type=ObservationType.UNCLEAR_CLAIM,
                        severity=1,
                        paragraph=idx,
                        title="Vague language",
                        note="This paragraph contains vague language that could be more specific.",
                        question="Can you be more specific about what you mean here?",
                    )
                )
                break  # Only one observation per paragraph for this check

    return observations


def analyze(
    text: str,
    snapshots: Optional[list[Snapshot]] = None,
    goal: Optional[str] = None,  # noqa: ARG001 - reserved for future use
) -> AnalyzeResponse:
    """Analyze text and return structured feedback.

    This is the main entry point for text analysis. Currently uses
    deterministic heuristics. Structured to allow easy addition of
    LLM-based analysis in the future via a provider pattern.

    Args:
        text: The current text to analyze.
        snapshots: Historical snapshots for instability analysis.
        goal: Optional writing goal (reserved for future use).

    Returns:
        AnalyzeResponse with observations, instability info, and metadata.
    """
    snapshots = snapshots or []
    paragraphs = compute_paragraphs(text)

    # Collect observations from various heuristics
    observations: list[Observation] = []
    observations.extend(_check_long_paragraphs(paragraphs))
    observations.extend(_check_missing_evidence(paragraphs))
    observations.extend(_check_unclear_claims(paragraphs))

    # Compute instability from snapshots
    rewrite_counts = compute_instability(snapshots)
    unstable: list[UnstableParagraph] = []

    for para_idx, count in rewrite_counts.items():
        if count >= 2:  # Threshold for "unstable"
            # Add instability observation
            observations.append(
                Observation(
                    id=_generate_id(),
                    type=ObservationType.INSTABILITY,
                    severity=1 if count < 4 else 2,
                    paragraph=para_idx,
                    title="Frequently rewritten",
                    note=f"This paragraph has been rewritten {count} times.",
                    question="Are you struggling to express this idea clearly?",
                )
            )
            unstable.append(
                UnstableParagraph(
                    paragraph=para_idx,
                    rewrite_count=count,
                    note=f"Rewritten {count} times across snapshots",
                )
            )

    return AnalyzeResponse(
        observations=observations,
        unstable=unstable,
        meta=Meta(paragraph_count=len(paragraphs)),
    )


# Placeholder for future LLM integration
async def analyze_with_llm(
    text: str,
    snapshots: Optional[list[Snapshot]] = None,
    goal: Optional[str] = None,
    provider: Optional[str] = None,  # noqa: ARG001 - e.g., "openai", "anthropic"
) -> AnalyzeResponse:
    """Analyze text using an LLM provider.

    TODO: Implement when LLM integration is needed.
    For now, falls back to deterministic analysis.

    Args:
        text: The current text to analyze.
        snapshots: Historical snapshots for instability analysis.
        goal: Optional writing goal.
        provider: LLM provider to use.

    Returns:
        AnalyzeResponse with observations, instability info, and metadata.
    """
    # Future: Call LLM API here
    return analyze(text, snapshots, goal)
