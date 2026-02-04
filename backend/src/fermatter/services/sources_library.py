"""Demo sources library for the Fermatter demo.

Contains a small set of hardcoded sources that can be used to demonstrate
citation and reference features without requiring external APIs.
"""

from fermatter.models.schemas import LibrarySource, SourcesLibraryResponse

# Demo sources - a curated set for demonstration purposes
LIBRARY_SOURCES: list[LibrarySource] = [
    LibrarySource(
        id="S1",
        title="The Elements of Style",
        url="https://en.wikipedia.org/wiki/The_Elements_of_Style",
        snippet="Omit needless words. Vigorous writing is concise. A sentence should contain no unnecessary words, a paragraph no unnecessary sentences.",
    ),
    LibrarySource(
        id="S2",
        title="On Writing Well - William Zinsser",
        url="https://en.wikipedia.org/wiki/On_Writing_Well",
        snippet="Clutter is the disease of American writing. We are a society strangling in unnecessary words, circular constructions, pompous frills and meaningless jargon.",
    ),
    LibrarySource(
        id="S3",
        title="APA Publication Manual (7th ed.)",
        url="https://apastyle.apa.org/",
        snippet="Scholarly writing should be clear, concise, and free of bias. Every claim should be supported by evidence, properly cited.",
    ),
    LibrarySource(
        id="S4",
        title="Chicago Manual of Style",
        url="https://www.chicagomanualofstyle.org/",
        snippet="Good writing is good thinking made visible. Structure your arguments logically and support claims with credible sources.",
    ),
    LibrarySource(
        id="S5",
        title="Nature: How to Write a Paper",
        url="https://www.nature.com/nature/for-authors/formatting-guide",
        snippet="Scientific papers should present findings clearly. Avoid jargon where possible. State limitations explicitly.",
    ),
    LibrarySource(
        id="S6",
        title="Plain Language Guidelines",
        url="https://www.plainlanguage.gov/guidelines/",
        snippet="Use simple words and short sentences. Write for your reader, not yourself. Organize information logically.",
    ),
    LibrarySource(
        id="S7",
        title="Critical Thinking - Stanford Encyclopedia",
        url="https://plato.stanford.edu/entries/critical-thinking/",
        snippet="Critical thinking involves careful examination of claims and arguments. Identify assumptions, evaluate evidence, and consider alternative interpretations.",
    ),
    LibrarySource(
        id="S8",
        title="Logical Fallacies - Purdue OWL",
        url="https://owl.purdue.edu/owl/general_writing/academic_writing/logic_in_argumentative_writing/",
        snippet="Common fallacies include ad hominem attacks, straw man arguments, false dichotomies, and appeals to authority without evidence.",
    ),
]

# Create a lookup dictionary for fast access
_SOURCES_BY_ID: dict[str, LibrarySource] = {s.id: s for s in LIBRARY_SOURCES}


def get_all_sources() -> SourcesLibraryResponse:
    """Get all available library sources."""
    return SourcesLibraryResponse(sources=LIBRARY_SOURCES)


def get_source_by_id(source_id: str) -> LibrarySource | None:
    """Get a specific source by ID."""
    return _SOURCES_BY_ID.get(source_id)


def get_sources_by_ids(source_ids: list[str]) -> list[LibrarySource]:
    """Get multiple sources by their IDs."""
    return [s for sid in source_ids if (s := _SOURCES_BY_ID.get(sid))]


def format_sources_for_prompt(
    library_ids: list[str], user_sources: list[str]
) -> str:
    """Format sources for inclusion in an LLM prompt.

    Args:
        library_ids: IDs of library sources to include.
        user_sources: User-provided source strings (URLs or citations).

    Returns:
        Formatted string listing all sources with IDs.
    """
    lines: list[str] = []
    source_id_counter = 1

    # Add library sources
    for lib_id in library_ids:
        source = get_source_by_id(lib_id)
        if source:
            lines.append(f"[{source.id}] {source.title} — {source.url}")
            lines.append(f"    {source.snippet}")

    # Add user sources with generated IDs (starting after library sources)
    for user_source in user_sources:
        user_id = f"U{source_id_counter}"
        lines.append(f"[{user_id}] User-provided: {user_source}")
        source_id_counter += 1

    return "\n".join(lines) if lines else "No sources provided."
