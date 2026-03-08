from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from contextlib import asynccontextmanager

from src.core.config import settings
from src.api.middleware.logging import LoggingMiddleware
from src.api.middleware.error_handlers import (
    http_exception_handler,
    validation_exception_handler,
    general_exception_handler,
)
from src.api.middleware.rate_limit import RateLimitMiddleware
from src.api.middleware.security import SecurityHeadersMiddleware
from src.db.redis import redis_client
from src.api.routes import (
    chat, 
    playground, 
    repository, 
    sessions, 
    progress, 
    snippets,
    challenges,
    leaderboard,
    review
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown"""
    # Startup
    await redis_client.connect()
    yield
    # Shutdown
    await redis_client.disconnect()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging middleware
app.add_middleware(LoggingMiddleware)

# Rate Limiting middleware
app.add_middleware(RateLimitMiddleware, redis_client=redis_client)

# Exception handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": settings.APP_VERSION}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Include routers
app.include_router(repository.router)
app.include_router(chat.router)
app.include_router(playground.router)
app.include_router(sessions.router)
app.include_router(progress.router)
app.include_router(snippets.router)
app.include_router(challenges.router)
app.include_router(leaderboard.router)
app.include_router(review.router)
