"""3-pass reranking for retrieval results."""

import logging
import re
from typing import Dict, List

logger = logging.getLogger(__name__)


class ThreePassReranker:
    """Rerank retrieval results using 3-pass strategy."""
    
    def rerank(self, results: List[Dict], query: str) -> List[Dict]:
        """Apply 3-pass reranking to results.
        
        Args:
            results: List of retrieval results
            query: Original query
            
        Returns:
            Reranked results
        """
        if not results:
            return results
        
        # Pass 1: Semantic similarity (already have scores)
        pass1 = self._pass1_semantic(results)
        
        # Pass 2: Code relevance
        pass2 = self._pass2_code_relevance(pass1, query)
        
        # Pass 3: Context window optimization
        pass3 = self._pass3_context_optimization(pass2)
        
        logger.debug(f"Reranked {len(results)} results")
        return pass3
    
    def _pass1_semantic(self, results: List[Dict]) -> List[Dict]:
        """Pass 1: Rerank by semantic similarity score.
        
        Args:
            results: Results with similarity scores
            
        Returns:
            Results sorted by score
        """
        return sorted(
            results,
            key=lambda x: x.get("score", 0),
            reverse=True,
        )
    
    def _pass2_code_relevance(
        self,
        results: List[Dict],
        query: str,
    ) -> List[Dict]:
        """Pass 2: Rerank by code-specific relevance.
        
        Args:
            results: Results from pass 1
            query: Original query
            
        Returns:
            Results with code relevance scores
        """
        scored = []
        
        for result in results:
            content = result.get("content", "")
            code_score = 0.0
            
            # Boost if contains function/class definitions
            if self._has_definitions(content):
                code_score += 0.2
            
            # Boost if contains imports related to query
            if self._has_relevant_imports(content, query):
                code_score += 0.1
            
            # Boost if entity type matches query intent
            if self._entity_type_matches(result.get("entity_type", ""), query):
                code_score += 0.15
            
            # Boost if from graph source (structural relevance)
            if result.get("source") == "graph":
                code_score += 0.05
            
            # Combine with original score
            result["code_relevance_score"] = code_score
            result["combined_score"] = result.get("score", 0) + code_score
            scored.append(result)
        
        # Sort by combined score
        return sorted(
            scored,
            key=lambda x: x.get("combined_score", 0),
            reverse=True,
        )
    
    def _pass3_context_optimization(self, results: List[Dict]) -> List[Dict]:
        """Pass 3: Optimize for context window diversity.
        
        Args:
            results: Results from pass 2
            
        Returns:
            Optimized results with diverse file sources
        """
        seen_files = set()
        optimized = []
        
        # First pass: add top results from unique files
        for result in results:
            file_path = result.get("file_path", "")
            if file_path and file_path not in seen_files:
                optimized.append(result)
                seen_files.add(file_path)
                
                # Stop after 10 unique files
                if len(seen_files) >= 10:
                    break
        
        # Second pass: add remaining high-scoring results
        for result in results:
            if result not in optimized and len(optimized) < len(results):
                optimized.append(result)
        
        return optimized
    
    def _has_definitions(self, content: str) -> bool:
        """Check if content contains function or class definitions.
        
        Args:
            content: Code content
            
        Returns:
            True if contains definitions
        """
        patterns = [
            r'\bdef\s+\w+\s*\(',  # Python function
            r'\bclass\s+\w+',  # Python/Java class
            r'\bfunction\s+\w+\s*\(',  # JavaScript function
            r'\bconst\s+\w+\s*=\s*\(',  # Arrow function
            r'\bpublic\s+\w+\s+\w+\s*\(',  # Java method
        ]
        
        for pattern in patterns:
            if re.search(pattern, content):
                return True
        return False
    
    def _has_relevant_imports(self, content: str, query: str) -> bool:
        """Check if content has imports relevant to query.
        
        Args:
            content: Code content
            query: Search query
            
        Returns:
            True if has relevant imports
        """
        # Extract import statements
        import_patterns = [
            r'import\s+(\w+)',  # Python/Java import
            r'from\s+(\w+)\s+import',  # Python from import
            r'require\(["\'](\w+)["\']\)',  # Node.js require
        ]
        
        imports = []
        for pattern in import_patterns:
            matches = re.findall(pattern, content)
            imports.extend(matches)
        
        # Check if any import keyword appears in query
        query_lower = query.lower()
        for imp in imports:
            if imp.lower() in query_lower:
                return True
        
        return False
    
    def _entity_type_matches(self, entity_type: str, query: str) -> bool:
        """Check if entity type matches query intent.
        
        Args:
            entity_type: Type of entity (function, class, etc.)
            query: Search query
            
        Returns:
            True if type matches intent
        """
        query_lower = query.lower()
        
        # Map query keywords to entity types
        type_keywords = {
            "function": ["function", "method", "def"],
            "class": ["class", "object", "type"],
            "variable": ["variable", "var", "const", "let"],
            "import": ["import", "require", "dependency"],
        }
        
        entity_lower = entity_type.lower()
        
        for etype, keywords in type_keywords.items():
            if etype in entity_lower:
                for keyword in keywords:
                    if keyword in query_lower:
                        return True
        
        return False
