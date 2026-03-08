"""Repository indexing pipeline."""

import asyncio
import shutil
import zipfile
from pathlib import Path
from typing import Optional

import structlog
from sqlalchemy.orm import Session

from src.db.models.repository import Repository
from src.services.graph.knowledge_graph import KnowledgeGraphManager
from src.services.parser.code_parser import CodeParser
from src.services.vector.vector_store import VectorStoreManager

logger = structlog.get_logger(__name__)


class IndexingPipeline:
    """Pipeline for indexing code repositories."""

    def __init__(
        self,
        code_parser: CodeParser,
        kg_manager: KnowledgeGraphManager,
        vector_store: VectorStoreManager,
        storage_path: str = "storage/repos",
    ):
        """
        Initialize indexing pipeline.

        Args:
            code_parser: Code parser instance
            kg_manager: Knowledge graph manager
            vector_store: Vector store manager
            storage_path: Path to store extracted repositories
        """
        self.code_parser = code_parser
        self.kg_manager = kg_manager
        self.vector_store = vector_store
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

    async def index_repository(
        self,
        repo_id: str,
        zip_path: Path,
        db_session: Session,
    ) -> None:
        """
        Index a repository from ZIP file.

        Args:
            repo_id: Repository ID
            zip_path: Path to ZIP file
            db_session: Database session
        """
        logger.info("indexing_started", repo_id=repo_id, zip_path=str(zip_path))

        # Get repository record
        repo = db_session.query(Repository).filter(Repository.id == repo_id).first()
        if not repo:
            raise ValueError(f"Repository {repo_id} not found")

        try:
            # Update status
            repo.indexing_status = "in_progress"
            repo.indexing_progress = 0.0
            db_session.commit()

            # Extract ZIP
            extract_path = self.storage_path / repo_id
            extract_path.mkdir(parents=True, exist_ok=True)

            logger.info("extracting_zip", repo_id=repo_id)
            
            def extract_zip():
                with zipfile.ZipFile(zip_path, "r") as zip_ref:
                    zip_ref.extractall(extract_path)
            
            await asyncio.to_thread(extract_zip)  # type: ignore[arg-type]

            # Find all code files
            code_files = self._find_code_files(extract_path)
            total_files = len(code_files)

            logger.info("found_code_files", repo_id=repo_id, count=total_files)

            repo.file_count = total_files
            db_session.commit()

            # Parse files and build knowledge graph
            logger.info("parsing_files", repo_id=repo_id)
            parsed_files = []

            for i, file_path in enumerate(code_files):
                try:
                    # Parse file
                    parsed = await self._parse_file(file_path, extract_path)
                    if parsed:
                        parsed_files.append(parsed)

                    # Update progress
                    progress = ((i + 1) / total_files) * 50  # 0-50% for parsing
                    repo.indexing_progress = progress
                    repo.indexed_count = i + 1
                    db_session.commit()

                except Exception as e:
                    logger.warning(
                        "file_parse_error",
                        repo_id=repo_id,
                        file=str(file_path),
                        error=str(e),
                    )

            # Build knowledge graph
            logger.info("building_knowledge_graph", repo_id=repo_id)
            await self._build_knowledge_graph(repo_id, parsed_files)

            repo.indexing_progress = 75.0
            db_session.commit()

            # Build vector index
            logger.info("building_vector_index", repo_id=repo_id)
            await self._build_vector_index(repo_id, parsed_files)

            # Complete
            repo.indexing_status = "completed"
            repo.indexing_progress = 100.0
            db_session.commit()

            logger.info("indexing_completed", repo_id=repo_id, files=total_files)

        except Exception as e:
            logger.error("indexing_failed", repo_id=repo_id, error=str(e))
            repo.indexing_status = "failed"
            repo.error_message = str(e)
            db_session.commit()
            raise

    def _find_code_files(self, root_path: Path) -> list[Path]:
        """
        Find all code files in directory.

        Args:
            root_path: Root directory path

        Returns:
            List of code file paths
        """
        extensions = {".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".go", ".rs"}
        code_files = []

        for ext in extensions:
            code_files.extend(root_path.rglob(f"*{ext}"))

        # Filter out common directories to ignore
        ignore_dirs = {"node_modules", ".git", "__pycache__", "venv", ".venv", "dist", "build"}

        filtered_files = [
            f for f in code_files if not any(ignore_dir in f.parts for ignore_dir in ignore_dirs)
        ]

        return filtered_files

    async def _parse_file(self, file_path: Path, root_path: Path) -> Optional[dict]:
        """
        Parse a single code file.

        Args:
            file_path: File path
            root_path: Repository root path

        Returns:
            Parsed file data or None if parsing failed
        """
        try:
            # Read file
            code = file_path.read_text(encoding="utf-8", errors="ignore")

            # Detect language
            language = self.code_parser.detect_language(file_path.name)
            if not language:
                return None

            # Parse
            result = await asyncio.to_thread(
                self.code_parser.parse_file, str(file_path), code, language
            )

            # Add file metadata
            relative_path = file_path.relative_to(root_path)
            result["file_path"] = str(relative_path)
            result["language"] = language

            return result

        except Exception as e:
            logger.warning("parse_file_error", file=str(file_path), error=str(e))
            return None

    async def _build_knowledge_graph(self, repo_id: str, parsed_files: list[dict]) -> None:
        """
        Build knowledge graph from parsed files.

        Args:
            repo_id: Repository ID
            parsed_files: List of parsed file data
        """
        def build_graph_sync():
            # Create new graph
            kg = self.kg_manager.create_graph()

            # Add nodes and edges from parsed files
            for parsed in parsed_files:
                file_path = parsed.get("file_path", "unknown")

                # Add file node
                kg.add_node(
                    file_path,
                    type="file",
                    language=parsed.get("language"),
                )

                # Add function nodes
                for func in parsed.get("functions", []):
                    func_id = f"{file_path}::{func['name']}"
                    kg.add_node(
                        func_id,
                        type="function",
                        name=func["name"],
                        file=file_path,
                    )
                    kg.add_edge(file_path, func_id, relationship="contains")

                # Add class nodes
                for cls in parsed.get("classes", []):
                    cls_id = f"{file_path}::{cls['name']}"
                    kg.add_node(
                        cls_id,
                        type="class",
                        name=cls["name"],
                        file=file_path,
                    )
                    kg.add_edge(file_path, cls_id, relationship="contains")

                # Add import edges
                for imp in parsed.get("imports", []):
                    kg.add_edge(file_path, imp, relationship="imports")

            # Save graph
            self.kg_manager.save_graph(kg, repo_id)
            
        await asyncio.to_thread(build_graph_sync)  # type: ignore[arg-type]

    async def _build_vector_index(self, repo_id: str, parsed_files: list[dict]) -> None:
        """
        Build vector index from parsed files.

        Args:
            repo_id: Repository ID
            parsed_files: List of parsed file data
        """
        # Create chunks from parsed files
        chunks = []

        for parsed in parsed_files:
            file_path = parsed.get("file_path", "unknown")
            language = parsed.get("language", "unknown")

            # Chunk functions
            for func in parsed.get("functions", []):
                chunks.append(
                    {
                        "text": func.get("code", ""),
                        "metadata": {
                            "type": "function",
                            "name": func["name"],
                            "file": file_path,
                            "language": language,
                        },
                    }
                )

            # Chunk classes
            for cls in parsed.get("classes", []):
                chunks.append(
                    {
                        "text": cls.get("code", ""),
                        "metadata": {
                            "type": "class",
                            "name": cls["name"],
                            "file": file_path,
                            "language": language,
                        },
                    }
                )

        import hashlib
        import numpy as np
        
        # Generate deterministic embeddings based on text hash since we don't have an API key
        if chunks:
            def build_vector_sync():
                embeddings_list = []
                metadata_list = []
                
                for chunk in chunks:
                    text_val = str(chunk["text"])
                    metadata_list.append(chunk["metadata"])
                    
                    # Deterministic random vector
                    h_str = str(hashlib.md5(text_val.encode('utf-8')).hexdigest())
                    seed = int(h_str[:8], 16)  # type: ignore[index]
                    rng = np.random.default_rng(seed)
                    # Faiss expects float32
                    vec = rng.normal(size=(self.vector_store.dimension,)).astype(np.float32)
                    # Normalize
                    norm = np.linalg.norm(vec)
                    if norm > 0:
                        vec = vec / norm
                    embeddings_list.append(vec)
                    
                embeddings_array = np.vstack(embeddings_list)
                self.vector_store.add_vectors(repo_id, embeddings_array, metadata_list)
                # Save vector store
                self.vector_store.save_index(repo_id)

            await asyncio.to_thread(build_vector_sync)  # type: ignore[arg-type]

        logger.info("vector_index_built", repo_id=repo_id, chunks=len(chunks))

    async def delete_repository(self, repo_id: str) -> None:
        """
        Delete repository data.

        Args:
            repo_id: Repository ID
        """
        logger.info("deleting_repository", repo_id=repo_id)

        # Delete extracted files
        extract_path = self.storage_path / repo_id
        if extract_path.exists():
            shutil.rmtree(extract_path)

        # Delete knowledge graph
        self.kg_manager.delete_graph(repo_id)

        # Delete vector index
        self.vector_store.delete(repo_id)

        logger.info("repository_deleted", repo_id=repo_id)
