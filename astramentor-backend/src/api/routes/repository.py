"""Repository management endpoints."""

import asyncio
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import List, Dict, Any

import structlog

from src.api.models.repository import (
    IndexingStatus,
    RepositoryDeleteResponse,
    RepositoryStatusResponse,
    RepositoryUploadResponse,
)
from src.api.middleware.auth import get_current_user
from src.core.config import get_settings
from src.db.base import get_db
from src.db.models.repository import Repository
from src.services.indexing.pipeline import IndexingPipeline

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1/repo", tags=["repository"])

# Maximum file size: 100MB
MAX_FILE_SIZE = 100 * 1024 * 1024

class GitHubImportRequest(BaseModel):
    url: str = Field(..., description="GitHub repository URL")

class RepoQARequest(BaseModel):
    repo_id: str
    question: str
    session_id: str | None = None


@router.post("/upload", response_model=RepositoryUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_repository(
    file: UploadFile = File(..., description="ZIP file containing repository"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> RepositoryUploadResponse:
    user_id = current_user.get("user_id", "unknown")
    """
    Upload a code repository for indexing.

    - Accepts ZIP files up to 100MB
    - Extracts and indexes code files
    - Returns repository ID for tracking
    """
    logger.info("repository_upload_started", filename=file.filename, user_id=user_id)

    # Validate file type
    if not file.filename or not file.filename.endswith(".zip"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only ZIP files are supported",
        )

    # Read file
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum of {MAX_FILE_SIZE // (1024 * 1024)}MB",
        )

    try:
        # Generate repository ID
        repo_id = str(uuid.uuid4())

        # Save to S3 (or local storage for now)
        settings = get_settings()
        storage_path = Path(settings.STORAGE_PATH) / "uploads"
        storage_path.mkdir(parents=True, exist_ok=True)

        zip_path = storage_path / f"{repo_id}.zip"
        zip_path.write_bytes(content)  # type: ignore[arg-type]

        # Create repository record
        repo = Repository(
            id=repo_id,
            name=file.filename.replace(".zip", ""),
            user_id=user_id,
            s3_key=f"repos/{repo_id}.zip",
            indexing_status="pending",
            indexing_progress=0.0,
            file_count=0,
            indexed_count=0,
        )

        db.add(repo)
        db.commit()
        db.refresh(repo)

        # Start indexing in background
        # TODO: Use Celery or AWS Lambda for production
        asyncio.create_task(_index_repository_background(repo_id, zip_path))

        logger.info("repository_upload_completed", repo_id=repo_id, filename=file.filename)

        return RepositoryUploadResponse(
            id=repo_id,
            name=repo.name,
            status=IndexingStatus(repo.indexing_status),
            message="Repository uploaded successfully. Indexing started.",
        )

    except Exception as e:
        logger.error("repository_upload_error", error=str(e), filename=file.filename)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload repository: {str(e)}",
        )


@router.get("/{repo_id}/status", response_model=RepositoryStatusResponse)
async def get_repository_status(
    repo_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> RepositoryStatusResponse:
    user_id = current_user.get("user_id", "unknown")
    """
    Get repository indexing status.

    Returns current indexing progress and metadata.
    """
    # Get repository
    repo = db.query(Repository).filter(Repository.id == repo_id).first()

    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repository {repo_id} not found",
        )

    # Check ownership
    if repo.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return RepositoryStatusResponse(
        id=repo.id,
        name=repo.name,
        status=IndexingStatus(repo.indexing_status),
        progress=repo.indexing_progress,
        file_count=repo.file_count,
        indexed_count=repo.indexed_count,
        created_at=repo.created_at,
        updated_at=repo.updated_at,
        error_message=repo.error_message,
    )


@router.delete("/{repo_id}", response_model=RepositoryDeleteResponse)
async def delete_repository(
    repo_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> RepositoryDeleteResponse:
    user_id = current_user.get("user_id", "unknown")
    """
    Delete a repository and all associated data.

    - Removes repository record from database
    - Deletes S3 files
    - Deletes knowledge graph and vector index
    """
    logger.info("repository_delete_started", repo_id=repo_id, user_id=user_id)

    # Get repository
    repo = db.query(Repository).filter(Repository.id == repo_id).first()

    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repository {repo_id} not found",
        )

    # Check ownership
    if repo.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    try:
        # Delete from database
        db.delete(repo)
        db.commit()

        # Delete files and indices in background
        asyncio.create_task(_delete_repository_background(repo_id))

        logger.info("repository_deleted", repo_id=repo_id)

        return RepositoryDeleteResponse(
            id=repo_id,
            message="Repository deleted successfully",
        )

    except Exception as e:
        logger.error("repository_delete_error", repo_id=repo_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete repository: {str(e)}",
        )


@router.get("", response_model=List[Dict[str, Any]])
async def list_repositories(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List all repositories for the current user."""
    user_id = current_user.get("user_id", "unknown")
    repos = db.query(Repository).filter(Repository.user_id == user_id).all()
    
    return [
        {
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "language": "python", # Mock language
            "file_count": r.file_count,
            "line_count": getattr(r, "line_count", 0),
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "status": "ready" if r.indexing_status == "completed" else "processing",
        }
        for r in repos
    ]


@router.get("/{repo_id}", response_model=Dict[str, Any])
async def get_repository(
    repo_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get details for a specific repository."""
    user_id = current_user.get("user_id", "unknown")
    repo = db.query(Repository).filter(Repository.id == repo_id, Repository.user_id == user_id).first()
    
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
        
    return {
        "id": repo.id,
        "name": repo.name,
        "description": repo.description,
        "language": "python",
        "file_count": repo.file_count,
        "line_count": getattr(repo, "line_count", 0),
        "created_at": repo.created_at.isoformat() if repo.created_at else None,
        "status": "ready" if repo.indexing_status == "completed" else "processing",
    }


@router.post("/github", response_model=RepositoryUploadResponse, status_code=status.HTTP_201_CREATED)
async def import_from_github(
    request: GitHubImportRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> RepositoryUploadResponse:
    """Import a repository from a GitHub URL."""
    user_id = current_user.get("user_id", "unknown")
    repo_name = request.url.split("/")[-1].replace(".git", "")
    repo_id = str(uuid.uuid4())
    
    # Create repository record
    repo = Repository(
        id=repo_id,
        name=repo_name,
        user_id=user_id,
        s3_key=f"repos/{repo_id}.git",
        indexing_status="pending",
        indexing_progress=0.0,
        file_count=0,
        indexed_count=0,
    )

    db.add(repo)
    db.commit()
    db.refresh(repo)

    return RepositoryUploadResponse(
        id=repo_id,
        name=repo.name,
        status=IndexingStatus(repo.indexing_status),
        message="GitHub repository import started.",
    )


@router.post("/ask", response_model=Dict[str, Any])
async def ask_repository_question(
    request: RepoQARequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Ask a question about the codebase using RAG."""
    _user_id = current_user.get("user_id", "unknown")
    
    from src.services.vector.vector_store import VectorStoreManager
    from src.services.reviewer.llm_reviewer import generate_rag_answer
    import hashlib
    import numpy as np
    
    # 1. Generate query embedding (deterministic mock)
    h = hashlib.md5(request.question.encode('utf-8')).hexdigest()
    seed = int(h[:8], 16)  # type: ignore[index]
    rng = np.random.default_rng(seed)
    
    vector_store = VectorStoreManager(dimension=1536)
    query_vec = rng.normal(size=(vector_store.dimension,)).astype(np.float32)
    norm = np.linalg.norm(query_vec)
    if norm > 0:
        query_vec = query_vec / norm
        
    # 2. Search vector store
    results = vector_store.search(request.repo_id, query_vec, top_k=5)
    
    sources = []
    context_blocks = []
    
    for idx, r in enumerate(results):
        context_blocks.append(f"--- Snippet {idx+1} from {r.get('file', 'unknown')} ---\n{r.get('text', '')}")
        sources.append({
            "file_path": r.get('file', 'unknown'),
            "start_line": r.get('start_line', 0),
            "end_line": r.get('end_line', 0),
            "snippet": r.get('text', '')[:100] + "..." if r.get('text') else ""
        })
        
    context_str = "\n\n".join(context_blocks)
    
    # 3. Generate answer
    answer = await generate_rag_answer(request.question, context_str)
    
    if not sources:
        answer = "I could not find any relevant information in the indexed repository."
    
    return {
        "answer": answer,
        "sources": sources
    }


async def _index_repository_background(repo_id: str, zip_path: Path) -> None:
    """
    Index repository in background.

    Args:
        repo_id: Repository ID
        zip_path: Path to ZIP file
    """
    try:
        # TODO: Initialize dependencies properly
        # This is a placeholder - in production, use dependency injection
        from src.services.graph.knowledge_graph import KnowledgeGraphManager
        from src.services.parser.code_parser import CodeParser
        from src.services.vector.vector_store import VectorStoreManager
        from src.db.base import SessionLocal

        code_parser = CodeParser()
        kg_manager = KnowledgeGraphManager()
        vector_store = VectorStoreManager(dimension=1536)

        pipeline = IndexingPipeline(code_parser, kg_manager, vector_store)

        db = SessionLocal()
        try:
            await pipeline.index_repository(repo_id, zip_path, db)
        finally:
            db.close()

    except Exception as e:
        logger.error("background_indexing_error", repo_id=repo_id, error=str(e))


async def _delete_repository_background(repo_id: str) -> None:
    """
    Delete repository data in background.

    Args:
        repo_id: Repository ID
    """
    try:
        # TODO: Initialize dependencies properly
        from src.services.graph.knowledge_graph import KnowledgeGraphManager
        from src.services.parser.code_parser import CodeParser
        from src.services.vector.vector_store import VectorStoreManager

        code_parser = CodeParser()
        kg_manager = KnowledgeGraphManager()
        vector_store = VectorStoreManager(dimension=1536)

        pipeline = IndexingPipeline(code_parser, kg_manager, vector_store)

        await pipeline.delete_repository(repo_id)

    except Exception as e:
        logger.error("background_deletion_error", repo_id=repo_id, error=str(e))
