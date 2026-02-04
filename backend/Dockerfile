FROM python:3.11-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy project files
COPY pyproject.toml .
COPY src ./src

# Create venv and install dependencies
RUN uv venv /app/.venv && uv sync --no-dev

# Expose port
EXPOSE 8000

# Set PATH to use venv
ENV PATH="/app/.venv/bin:$PATH"

# Run the application
CMD ["uvicorn", "fermatter.main:app", "--host", "0.0.0.0", "--port", "8000"]
