"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from fermatter.api import router
from fermatter.core.config import settings
from fermatter.core.logging import setup_logging

setup_logging()

app = FastAPI(
    title="Fermatter API",
    description="Structured writing feedback API",
    version="0.1.0",
)

# CORS middleware for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
