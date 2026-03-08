# Phase 2: Data Layer - Implementation Guide

## Overview
Implement code parsing, knowledge graph, and vector search capabilities.

## Components Implemented

### 1. Code Parser (Tree-sitter)

**File**: `src/services/parser/code_parser.py`

**Features**:
- Multi-language support (Python, JavaScript, TypeScript, Java, Go, Rust)
- Entity extraction (functions, classes, imports, variables)
- Complexity metrics (cyclomatic complexity, nesting depth)
- Code smell detection (long functions)
- Automatic language detection from file extensions

**Usage**:
```python
from src.services.parser.code_parser import code_parser

# Parse a file
entities = code_parser.parse_file(
    file_path="example.py",
    content=code_content,
    language="python"  # Optional, auto-detected
)

# Access extracted entities
functions = entities["functions"]
classes = entities["classes"]
complexity = entities["complexity"]
```

### 2. Knowledge Graph (NetworkX)

**File**: `src/services/graph/knowledge_graph.py`

**Features**:
- Graph construction from parsed code
- Node types: files, classes, functions, variables
- Edge types: imports, calls, extends, implements, depends_on
- Graph queries (related nodes, dependencies, dependents)
- Community detection for concept clustering
- Persistence to JSON

**Usage**:
```python
from src.services.graph.knowledge_graph import knowledge_graph_manager

# Add nodes
knowledge_graph_manager.add_node(
    repo_id="repo-123",
    node_id="file:example.py",
    node_type="file",
    attributes={"path": "example.py"}
)

# Add edges
knowledge_graph_manager.add_edge(
    repo_id="repo-123",
    source="file:example.py",
    target="file:utils.py",
    relationship="imports"
)

# Query graph
related = knowledge_graph_manager.get_related_nodes(
    repo_id="repo-123",
    entity="file:example.py",
    max_depth=2
)

# Save graph
knowledge_graph_manager.save_graph("repo-123")
```

### 3. Vector Store (FAISS)

**File**: `src/services/vector/vector_store.py`

**Features**:
- FAISS HNSW index for fast similarity search
- Semantic chunking (by entities or size with overlap)
- Metadata storage with vectors
- Cosine similarity search
- Metadata filtering
- Persistence to disk

**Usage**:
```python
from src.services.vector.vector_store import vector_store_manager, semantic_chunker
import numpy as np

# Chunk code
chunks = semantic_chunker.chunk_code(
    content=code_content,
    file_path="example.py",
    language="python",
    entities=parsed_entities
)

# Add vectors (embeddings from Bedrock)
embeddings = np.array([...])  # From Bedrock Titan
vector_store_manager.add_vectors(
    repo_id="repo-123",
    embeddings=embeddings,
    metadata_list=chunks
)

# Search
query_embedding = np.array([...])
results = vector_store_manager.search(
    repo_id="repo-123",
    embedding=query_embedding,
    top_k=20,
    filters={"language": "python"}
)

# Save index
vector_store_manager.save_index("repo-123")
```

## Integration Example

Here's how to use all three components together:

```python
from src.services.parser.code_parser import code_parser
from src.services.graph.knowledge_graph import knowledge_graph_manager
from src.services.vector.vector_store import vector_store_manager, semantic_chunker

async def index_repository(repo_id: str, files: List[Dict[str, str]]):
    """Index a repository with all data layer components"""
    
    for file_info in files:
        file_path = file_info["path"]
        content = file_info["content"]
        
        # 1. Parse code
        entities = code_parser.parse_file(file_path, content)
        
        if "error" in entities:
            continue
        
        # 2. Build knowledge graph
        # Add file node
        knowledge_graph_manager.add_node(
            repo_id=repo_id,
            node_id=f"file:{file_path}",
            node_type="file",
            attributes={"path": file_path, "language": entities["language"]}
        )
        
        # Add function nodes
        for func in entities["functions"]:
            func_id = f"function:{file_path}:{func['name']}"
            knowledge_graph_manager.add_node(
                repo_id=repo_id,
                node_id=func_id,
                node_type="function",
                attributes=func
            )
            # Link function to file
            knowledge_graph_manager.add_edge(
                repo_id=repo_id,
                source=f"file:{file_path}",
                target=func_id,
                relationship="contains"
            )
        
        # Add class nodes
        for cls in entities["classes"]:
            cls_id = f"class:{file_path}:{cls['name']}"
            knowledge_graph_manager.add_node(
                repo_id=repo_id,
                node_id=cls_id,
                node_type="class",
                attributes=cls
            )
            # Link class to file
            knowledge_graph_manager.add_edge(
                repo_id=repo_id,
                source=f"file:{file_path}",
                target=cls_id,
                relationship="contains"
            )
        
        # 3. Create vector embeddings
        chunks = semantic_chunker.chunk_code(
            content=content,
            file_path=file_path,
            language=entities["language"],
            entities=entities
        )
        
        # Get embeddings from Bedrock (Phase 3)
        # embeddings = await bedrock_client.get_embeddings([c["content"] for c in chunks])
        # vector_store_manager.add_vectors(repo_id, embeddings, chunks)
    
    # Save everything
    knowledge_graph_manager.save_graph(repo_id)
    vector_store_manager.save_index(repo_id)
```

## Testing

### Unit Tests

Create `tests/unit/services/test_code_parser.py`:
```python
from src.services.parser.code_parser import code_parser

def test_parse_python_function():
    content = '''
def hello(name):
    """Say hello"""
    return f"Hello, {name}!"
'''
    entities = code_parser.parse_file("test.py", content, "python")
    
    assert len(entities["functions"]) == 1
    assert entities["functions"][0]["name"] == "hello"
    assert "name" in entities["functions"][0]["parameters"]
```

Create `tests/unit/services/test_knowledge_graph.py`:
```python
from src.services.graph.knowledge_graph import KnowledgeGraphManager

def test_add_node_and_edge():
    kg = KnowledgeGraphManager()
    repo_id = "test-repo"
    
    kg.add_node(repo_id, "node1", "file", {"path": "test.py"})
    kg.add_node(repo_id, "node2", "function", {"name": "test"})
    kg.add_edge(repo_id, "node1", "node2", "contains")
    
    related = kg.get_related_nodes(repo_id, "node1", max_depth=1)
    assert len(related) == 2  # node1 and node2
```

Create `tests/unit/services/test_vector_store.py`:
```python
import numpy as np
from src.services.vector.vector_store import VectorStoreManager

def test_add_and_search():
    vs = VectorStoreManager()
    repo_id = "test-repo"
    
    # Add vectors
    embeddings = np.random.rand(5, 1536).astype('float32')
    metadata = [{"id": i, "content": f"chunk {i}"} for i in range(5)]
    vs.add_vectors(repo_id, embeddings, metadata)
    
    # Search
    query = np.random.rand(1536).astype('float32')
    results = vs.search(repo_id, query, top_k=3)
    
    assert len(results) <= 3
    assert all("score" in r for r in results)
```

## Next Steps

Phase 2 is complete! The data layer provides:
- ✅ Multi-language code parsing
- ✅ Knowledge graph construction
- ✅ Vector search with FAISS
- ✅ Semantic chunking

**Next: Phase 3 - Retrieval (RAG Pipeline)**

Implement:
1. AWS Bedrock client
2. 5-stage RAG pipeline
3. Query enhancement (HyDE)
4. Query decomposition
5. Hybrid retrieval
6. 3-pass reranking
7. Context assembly

See [BACKEND_IMPLEMENTATION_SUMMARY.md](../BACKEND_IMPLEMENTATION_SUMMARY.md) for details.
