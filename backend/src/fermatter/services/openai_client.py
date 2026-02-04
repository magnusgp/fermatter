"""OpenAI integration for LLM-based text analysis.

Uses the OpenAI SDK to call the API for intelligent feedback generation.
Falls back to heuristics if LLM is unavailable or returns invalid data.
"""

import json
import logging
from typing import Any

from openai import OpenAI

from fermatter.core.config import settings
from fermatter.models.schemas import AnalysisMode, Observation, ObservationType

logger = logging.getLogger(__name__)

# Initialize OpenAI client (lazy, only if API key is configured)
_client: OpenAI | None = None


def get_client() -> OpenAI | None:
    """Get or create the OpenAI client."""
    global _client
    if _client is None and settings.openai_api_key:
        _client = OpenAI(api_key=settings.openai_api_key)
    return _client


# Mode-specific system prompt adjustments
MODE_PROMPTS: dict[AnalysisMode, str] = {
    AnalysisMode.SCIENTIFIC: """You are reviewing academic/scientific writing. 
Focus on: precision of claims, citation needs, logical structure, methodology clarity, 
and avoiding overstatement. Be rigorous but constructive.""",
    AnalysisMode.JOURNALIST: """You are reviewing journalistic writing.
Focus on: clarity for general audiences, lead strength, source attribution, 
fact-checking needs, and engaging structure. Be direct and practical.""",
    AnalysisMode.GRANDMA: """You are reviewing an email or letter to a family member.
Focus on: warmth, clarity, avoiding confusion, appropriate length, 
and emotional tone. Be gentle and supportive in your feedback.""",
}


def build_analysis_prompt(
    text: str,
    mode: AnalysisMode,
    sources_context: str,
    paragraphs: list[str],
    is_selection: bool = False,
) -> list[dict[str, str]]:
    """Build the messages for the OpenAI API call.

    Args:
        text: The text to analyze.
        mode: The analysis mode.
        sources_context: Formatted sources string.
        paragraphs: List of paragraph strings for reference.
        is_selection: Whether analyzing a selection vs full document.

    Returns:
        List of message dicts for the API.
    """
    scope_note = (
        "You are analyzing a TEXT SELECTION from a larger document."
        if is_selection
        else "You are analyzing the FULL DOCUMENT."
    )

    system_prompt = f"""You are a writing critic and editor. Your role is to provide feedback ONLY.

CRITICAL RULES:
1. NEVER write replacement text or suggested sentences for the user
2. NEVER rewrite any part of their text
3. Only provide critiques, questions, flags, and references
4. Be specific about which paragraph (0-indexed) you're commenting on
5. Quote a short "anchor_text" (3-10 words) from the paragraph you're referencing

{MODE_PROMPTS.get(mode, MODE_PROMPTS[AnalysisMode.SCIENTIFIC])}

{scope_note}

AVAILABLE SOURCES FOR CITATION:
{sources_context}

CITATION RULES:
- When recommending references, ONLY cite from the provided sources using [S#] or [U#] format
- If no source supports a claim that needs support, output a "citation_needed" observation
- NEVER invent or hallucinate sources

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{{
  "observations": [
    {{
      "type": "missing_evidence|unclear_claim|logic_gap|structure|tone|precision|citation_needed",
      "severity": 1-5,
      "paragraph": 0,
      "anchor_text": "short quoted text",
      "title": "Brief title",
      "note": "Detailed explanation",
      "question": "Question for the writer to consider",
      "source_ids": ["S1", "S2"]
    }}
  ]
}}

Make 3-8 high-signal observations. Prefer quality over quantity.
Severity scale: 1=minor suggestion, 3=should address, 5=critical issue.
"""

    # Build the numbered paragraph reference
    para_text = "\n\n".join(
        f"[Paragraph {i}]\n{p}" for i, p in enumerate(paragraphs)
    )

    user_prompt = f"""Please analyze the following text and provide feedback.

TEXT TO ANALYZE:
{para_text}

Remember: Return ONLY valid JSON matching the schema. No markdown, no explanations outside the JSON."""

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


def parse_llm_response(content: str) -> list[dict[str, Any]] | None:
    """Parse the LLM response into observation dicts.

    Args:
        content: The raw response content from the LLM.

    Returns:
        List of observation dicts, or None if parsing fails.
    """
    try:
        # Try to extract JSON from the response
        # Handle cases where the response might have markdown code blocks
        cleaned = content.strip()
        if cleaned.startswith("```"):
            # Remove markdown code blocks
            lines = cleaned.split("\n")
            json_lines = []
            in_block = False
            for line in lines:
                if line.startswith("```"):
                    in_block = not in_block
                    continue
                if in_block or not line.startswith("```"):
                    json_lines.append(line)
            cleaned = "\n".join(json_lines)

        data = json.loads(cleaned)

        if isinstance(data, dict) and "observations" in data:
            return data["observations"]
        elif isinstance(data, list):
            return data
        else:
            logger.warning("Unexpected LLM response structure")
            return None
    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse LLM response as JSON: {e}")
        return None


def validate_and_convert_observations(
    raw_observations: list[dict[str, Any]],
    paragraph_count: int,
) -> list[Observation]:
    """Validate and convert raw observation dicts to Observation models.

    Args:
        raw_observations: List of observation dicts from LLM.
        paragraph_count: Total number of paragraphs for validation.

    Returns:
        List of validated Observation models.
    """
    import uuid

    observations: list[Observation] = []

    for raw in raw_observations:
        try:
            # Validate and normalize the observation type
            obs_type = raw.get("type", "unclear_claim")
            try:
                obs_type_enum = ObservationType(obs_type)
            except ValueError:
                obs_type_enum = ObservationType.UNCLEAR_CLAIM

            # Validate paragraph index
            para_idx = raw.get("paragraph", 0)
            if not isinstance(para_idx, int) or para_idx < 0:
                para_idx = 0
            if para_idx >= paragraph_count:
                para_idx = max(0, paragraph_count - 1)

            # Validate severity
            severity = raw.get("severity", 2)
            if not isinstance(severity, int):
                severity = 2
            severity = max(1, min(5, severity))

            # Build the observation
            obs = Observation(
                id=str(uuid.uuid4())[:8],
                type=obs_type_enum,
                severity=severity,
                paragraph=para_idx,
                anchor_text=raw.get("anchor_text"),
                title=raw.get("title", "Observation"),
                note=raw.get("note", ""),
                question=raw.get("question", ""),
                source_ids=raw.get("source_ids", []),
            )
            observations.append(obs)
        except Exception as e:
            logger.warning(f"Failed to parse observation: {e}")
            continue

    return observations


async def call_openai_analysis(
    text: str,
    mode: AnalysisMode,
    sources_context: str,
    paragraphs: list[str],
    is_selection: bool = False,
) -> tuple[list[Observation], bool]:
    """Call OpenAI API for text analysis.

    Args:
        text: The text to analyze.
        mode: Analysis mode.
        sources_context: Formatted sources for the prompt.
        paragraphs: List of paragraph strings.
        is_selection: Whether this is a selection analysis.

    Returns:
        Tuple of (observations list, success boolean).
    """
    client = get_client()
    if client is None:
        logger.warning("OpenAI client not available (no API key)")
        return [], False

    messages = build_analysis_prompt(
        text=text,
        mode=mode,
        sources_context=sources_context,
        paragraphs=paragraphs,
        is_selection=is_selection,
    )

    max_retries = 2
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=settings.openai_model,
                messages=messages,  # type: ignore
                # max_tokens=settings.openai_max_output_tokens,
                temperature=settings.openai_temperature,
            )

            content = response.choices[0].message.content
            if not content:
                logger.warning("Empty response from OpenAI")
                continue

            raw_observations = parse_llm_response(content)
            if raw_observations is None:
                # Retry with explicit JSON instruction
                if attempt < max_retries - 1:
                    messages.append({
                        "role": "user",
                        "content": "Please return ONLY valid JSON, no other text.",
                    })
                    continue
                else:
                    return [], False

            observations = validate_and_convert_observations(
                raw_observations, len(paragraphs)
            )
            return observations, True

        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            if attempt < max_retries - 1:
                continue
            return [], False

    return [], False
