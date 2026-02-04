# Fermatter

A structured writing feedback tool that analyzes text and provides deterministic observations about clarity, evidence, structure, and writing stability—without AI text generation or rewriting.

## Features

- **Structured Feedback**: Get actionable observations about your writing
- **Instability Detection**: Track which paragraphs you've rewritten frequently
- **Simple Heuristics**: Deterministic analysis based on text patterns
- **Extensible**: Designed for easy addition of LLM-based analysis

## Quick Start

### Prerequisites

- Python 3.11+
- [uv](https://github.com/astral-sh/uv) (Python package manager)
- Node.js 18+
- [pnpm](https://pnpm.io/)

### Backend

```bash
cd backend
cp .env.example .env
uv sync
uv run uvicorn fermatter.main:app --reload --port 8000
```

The API will be available at http://localhost:8000

### Frontend

```bash
cd frontend
cp .env.example .env
pnpm install
pnpm dev --port 5173
```

The app will be available at http://localhost:5173

### Using Docker (Optional)

```bash
docker-compose up
```

## API Contract

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

### POST /analyze

Analyze text and return structured feedback.

**Request:**
```json
{
  "text": "Your text content here...",
  "snapshots": [
    { "ts": "2024-01-15T10:30:00Z", "text": "Previous version..." }
  ],
  "goal": "optional writing goal"
}
```

**Response:**
```json
{
  "observations": [
    {
      "id": "abc12345",
      "type": "missing_evidence|unclear_claim|logic_gap|structure|instability",
      "severity": 1,
      "paragraph": 0,
      "title": "Short title",
      "note": "Detailed explanation",
      "question": "Guiding question for the writer"
    }
  ],
  "unstable": [
    { "paragraph": 0, "rewrite_count": 3, "note": "Rewritten 3 times" }
  ],
  "meta": { "paragraph_count": 5 }
}
```

## Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `ENV` | Environment name | `development` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:5173,http://127.0.0.1:5173` |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000` |

## Development

### Running Tests

```bash
cd backend
uv run pytest
```

### Code Formatting

```bash
cd backend
uv run ruff format .
uv run ruff check --fix .
```

## Project Structure

```
/
├── README.md
├── docker-compose.yml
├── backend/
│   ├── pyproject.toml
│   ├── src/fermatter/
│   │   ├── main.py          # FastAPI app
│   │   ├── api.py           # Route handlers
│   │   ├── core/            # Config, logging
│   │   ├── models/          # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utilities
│   └── tests/
└── frontend/
    ├── package.json
    ├── src/
    │   ├── App.tsx          # Main app
    │   ├── components/      # UI components
    │   └── lib/             # API client, types
    └── ...
```

## License

MIT
