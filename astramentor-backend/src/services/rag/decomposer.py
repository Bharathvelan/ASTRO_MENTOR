"""Query decomposition for complex queries."""

import logging
import re
from typing import List

logger = logging.getLogger(__name__)


class QueryDecomposer:
    """Decompose complex queries into sub-queries."""
    
    # Conjunctions that indicate multiple questions
    CONJUNCTIONS = ["and", "also", "additionally", "furthermore", "moreover"]
    
    def decompose_query(self, query: str) -> List[str]:
        """Decompose query into sub-queries if complex.
        
        Args:
            query: Original query
            
        Returns:
            List of sub-queries (or single query if not complex)
        """
        # Check if query contains conjunctions
        query_lower = query.lower()
        has_conjunction = any(conj in query_lower for conj in self.CONJUNCTIONS)
        
        if not has_conjunction:
            return [query]
        
        # Try to split on conjunctions
        sub_queries = self._split_on_conjunctions(query)
        
        # Filter out empty or very short queries
        sub_queries = [q.strip() for q in sub_queries if len(q.strip()) > 10]
        
        if len(sub_queries) <= 1:
            return [query]
        
        logger.debug(f"Decomposed query into {len(sub_queries)} sub-queries")
        return sub_queries
    
    def _split_on_conjunctions(self, query: str) -> List[str]:
        """Split query on conjunction words.
        
        Args:
            query: Query to split
            
        Returns:
            List of query parts
        """
        # Build regex pattern for conjunctions
        pattern = r'\b(' + '|'.join(self.CONJUNCTIONS) + r')\b'
        
        # Split on conjunctions
        parts = re.split(pattern, query, flags=re.IGNORECASE)
        
        # Remove conjunction words and combine parts
        sub_queries = []
        current = ""
        
        for part in parts:
            if part.lower().strip() in self.CONJUNCTIONS:
                if current:
                    sub_queries.append(current)
                current = ""
            else:
                current += part
        
        if current:
            sub_queries.append(current)
        
        return sub_queries
