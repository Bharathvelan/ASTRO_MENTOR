"""HyDE (Hypothetical Document Embeddings) query enhancement."""

import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.services.bedrock.client import BedrockClient

logger = logging.getLogger(__name__)


class HyDEEnhancer:
    """Query enhancement using Hypothetical Document Embeddings."""
    
    def __init__(self, bedrock_client: "BedrockClient"):
        """Initialize HyDE enhancer.
        
        Args:
            bedrock_client: Bedrock client for generating hypothetical documents
        """
        self.bedrock = bedrock_client
    
    async def enhance_query(self, query: str) -> str:
        """Enhance query by generating hypothetical relevant document.
        
        Args:
            query: Original user query
            
        Returns:
            Enhanced query with hypothetical document
        """
        prompt = self._build_hyde_prompt(query)
        
        try:
            # Use Haiku for fast hypothetical document generation
            hypothetical_doc = await self.bedrock.invoke_claude_haiku(
                prompt=prompt,
                max_tokens=512,
                temperature=0.7,
            )
            
            # Combine original query with hypothetical document
            enhanced = f"{query}\n\nHypothetical answer: {hypothetical_doc}"
            
            logger.debug(f"Enhanced query with HyDE: {len(enhanced)} chars")
            return enhanced
            
        except Exception as e:
            logger.warning(f"HyDE enhancement failed: {e}, using original query")
            return query
    
    def _build_hyde_prompt(self, query: str) -> str:
        """Build prompt for hypothetical document generation.
        
        Args:
            query: User query
            
        Returns:
            Prompt for Claude
        """
        return f"""Generate a hypothetical code snippet or documentation that would answer this question.
Be concise and focus on the key concepts.

Question: {query}

Hypothetical answer:"""
