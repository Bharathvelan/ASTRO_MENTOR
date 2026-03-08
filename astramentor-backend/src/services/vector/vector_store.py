import faiss
import numpy as np
import pickle
import os
from typing import Dict, List, Optional, Any
from src.core.config import settings


class VectorStoreManager:
    """Manages FAISS vector indices for code repositories"""
    
    def __init__(self, storage_path: Optional[str] = None, dimension: int = 1536):
        self.storage_path = storage_path or settings.VECTOR_STORAGE_PATH
        self.dimension = dimension
        self.indices: Dict[str, faiss.Index] = {}
        self.metadata: Dict[str, List[Dict[str, Any]]] = {}
        
        # Ensure storage directory exists
        os.makedirs(self.storage_path, exist_ok=True)
    
    def load_index(self, repo_id: str) -> faiss.Index:
        """Load FAISS index from disk or create new"""
        if repo_id in self.indices:
            return self.indices[repo_id]
        
        index_file = os.path.join(self.storage_path, f"{repo_id}_index.faiss")
        metadata_file = os.path.join(self.storage_path, f"{repo_id}_metadata.pkl")
        
        if os.path.exists(index_file) and os.path.exists(metadata_file):
            # Load existing index
            index = faiss.read_index(index_file)
            with open(metadata_file, 'rb') as f:
                metadata = pickle.load(f)
            
            self.indices[repo_id] = index
            self.metadata[repo_id] = metadata
            return index
        
        # Create new HNSW index
        index = faiss.IndexHNSWFlat(self.dimension, 32)
        self.indices[repo_id] = index
        self.metadata[repo_id] = []
        return index
    
    def save_index(self, repo_id: str) -> None:
        """Persist index to disk"""
        index = self.indices.get(repo_id)
        metadata = self.metadata.get(repo_id)
        
        if not index:
            return
        
        index_file = os.path.join(self.storage_path, f"{repo_id}_index.faiss")
        metadata_file = os.path.join(self.storage_path, f"{repo_id}_metadata.pkl")
        
        faiss.write_index(index, index_file)
        
        if metadata:
            with open(metadata_file, 'wb') as f:
                pickle.dump(metadata, f)
    
    def add_vectors(
        self,
        repo_id: str,
        embeddings: np.ndarray,
        metadata_list: List[Dict[str, Any]]
    ) -> None:
        """Add vectors to index with metadata"""
        index = self.load_index(repo_id)
        
        # Ensure embeddings are 2D
        if len(embeddings.shape) == 1:
            embeddings = embeddings.reshape(1, -1)
        
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings)
        
        # Add to index
        index.add(embeddings)
        
        # Store metadata
        if repo_id not in self.metadata:
            self.metadata[repo_id] = []
        self.metadata[repo_id].extend(metadata_list)
    
    def search(
        self,
        repo_id: str,
        embedding: np.ndarray,
        top_k: int = 20,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar vectors"""
        index = self.load_index(repo_id)
        metadata = self.metadata.get(repo_id, [])
        
        if index.ntotal == 0:
            return []
        
        # Ensure embedding is 2D
        if len(embedding.shape) == 1:
            embedding = embedding.reshape(1, -1)
        
        # Normalize query embedding
        faiss.normalize_L2(embedding)
        
        # Search
        k = min(top_k, index.ntotal)
        distances, indices = index.search(embedding, k)
        
        # Build results
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(metadata):
                result = metadata[idx].copy()
                result["score"] = float(distances[0][i])
                
                # Apply filters if provided
                if filters and not self._matches_filters(result, filters):
                    continue
                
                results.append(result)
        
        return results
    
    def _matches_filters(self, item: Dict[str, Any], filters: Dict[str, Any]) -> bool:
        """Check if item matches all filters"""
        for key, value in filters.items():
            if key not in item or item[key] != value:
                return False
        return True
    
    def get_index_stats(self, repo_id: str) -> Dict[str, Any]:
        """Get statistics about the index"""
        index = self.load_index(repo_id)
        metadata = self.metadata.get(repo_id, [])
        
        return {
            "num_vectors": index.ntotal,
            "dimension": self.dimension,
            "num_metadata": len(metadata),
        }
    
    def delete_index(self, repo_id: str) -> None:
        """Delete index from memory and disk"""
        if repo_id in self.indices:
            del self.indices[repo_id]
        if repo_id in self.metadata:
            del self.metadata[repo_id]
        
        index_file = os.path.join(self.storage_path, f"{repo_id}_index.faiss")
        metadata_file = os.path.join(self.storage_path, f"{repo_id}_metadata.pkl")
        
        if os.path.exists(index_file):
            os.remove(index_file)
        if os.path.exists(metadata_file):
            os.remove(metadata_file)


class SemanticChunker:
    """Chunks code into semantic units"""
    
    def __init__(self, chunk_size: int = 500, overlap: int = 50):
        self.chunk_size = chunk_size
        self.overlap = overlap
    
    def chunk_code(
        self,
        content: str,
        file_path: str,
        language: str,
        entities: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Chunk code into semantic units"""
        chunks = []
        
        # If we have entity information, chunk by entities
        if entities and entities.get("functions"):
            for func in entities["functions"]:
                start = func["start_byte"]
                end = func["end_byte"]
                chunk_content = content[start:end]
                
                chunks.append({
                    "content": chunk_content,
                    "file_path": file_path,
                    "language": language,
                    "entity_type": "function",
                    "entity_name": func["name"],
                    "start_line": func["start_line"],
                    "end_line": func["end_line"],
                })
        
        # If we have classes, chunk by classes
        if entities and entities.get("classes"):
            for cls in entities["classes"]:
                start = cls["start_byte"]
                end = cls["end_byte"]
                chunk_content = content[start:end]
                
                chunks.append({
                    "content": chunk_content,
                    "file_path": file_path,
                    "language": language,
                    "entity_type": "class",
                    "entity_name": cls["name"],
                    "start_line": cls["start_line"],
                    "end_line": cls["end_line"],
                })
        
        # If no entities or small file, chunk by size with overlap
        if not chunks:
            chunks = self._chunk_by_size(content, file_path, language)
        
        return chunks
    
    def _chunk_by_size(
        self,
        content: str,
        file_path: str,
        language: str
    ) -> List[Dict[str, Any]]:
        """Chunk content by size with overlap"""
        chunks = []
        lines = content.split('\n')
        
        i = 0
        chunk_id = 0
        
        while i < len(lines):
            # Take chunk_size lines
            chunk_lines = lines[i:i + self.chunk_size]
            chunk_content = '\n'.join(chunk_lines)
            
            chunks.append({
                "content": chunk_content,
                "file_path": file_path,
                "language": language,
                "entity_type": "chunk",
                "entity_name": f"chunk_{chunk_id}",
                "start_line": i,
                "end_line": i + len(chunk_lines),
            })
            
            # Move forward with overlap
            i += self.chunk_size - self.overlap
            chunk_id += 1
        
        return chunks


# Global instances
vector_store_manager = VectorStoreManager()
semantic_chunker = SemanticChunker()
