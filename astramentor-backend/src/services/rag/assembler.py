"""Context assembly with token budget management."""

import logging
from typing import Dict, List

logger = logging.getLogger(__name__)


class ContextAssembler:
    """Assemble final context within token budget."""
    
    def assemble(
        self,
        results: List[Dict],
        max_tokens: int = 8000,
    ) -> List[Dict]:
        """Assemble context within token budget.
        
        Args:
            results: Reranked retrieval results
            max_tokens: Maximum token budget
            
        Returns:
            Context items that fit within budget
        """
        context = []
        token_count = 0
        
        for result in results:
            content = result.get("content", "")
            
            # Estimate tokens for this result
            result_tokens = self._estimate_tokens(content)
            
            # Check if adding this result would exceed budget
            if token_count + result_tokens <= max_tokens:
                context.append(result)
                token_count += result_tokens
            else:
                # Budget exceeded, stop adding
                break
        
        logger.debug(
            f"Assembled context: {len(context)} items, "
            f"~{token_count} tokens (budget: {max_tokens})"
        )
        
        return context
    
    def _estimate_tokens(self, text: str) -> int:
        """Estimate token count for text.
        
        Uses rough approximation: 1 token ≈ 4 characters
        
        Args:
            text: Text to estimate
            
        Returns:
            Estimated token count
        """
        return len(text) // 4
    
    def format_context(self, context: List[Dict]) -> str:
        """Format context items into a single string.
        
        Args:
            context: List of context items
            
        Returns:
            Formatted context string
        """
        formatted_parts = []
        
        for i, item in enumerate(context, 1):
            file_path = item.get("file_path", "unknown")
            content = item.get("content", "")
            entity_type = item.get("entity_type", "")
            
            part = f"[{i}] File: {file_path}"
            if entity_type:
                part += f" (Type: {entity_type})"
            part += f"\n{content}\n"
            
            formatted_parts.append(part)
        
        return "\n---\n".join(formatted_parts)
