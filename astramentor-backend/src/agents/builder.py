"""Builder agent for code generation and refactoring."""

import logging
from typing import Dict

from .base import BaseAgent

logger = logging.getLogger(__name__)


class BuilderAgent(BaseAgent):
    """Agent for code generation and refactoring suggestions."""
    
    async def process(self, state: Dict) -> str:
        """Generate code or refactoring suggestions.
        
        Args:
            state: Agent state
            
        Returns:
            Code suggestions
        """
        query = state.get("query", "")
        context = state.get("retrieved_context", [])
        
        # Build generation prompt
        prompt = self._build_generation_prompt(query, context)
        
        # Generate response
        response = await self.bedrock.invoke_claude_sonnet(
            prompt=prompt,
            system_prompt=self._get_system_prompt(),
            max_tokens=3072,
            temperature=0.7,
        )
        
        return response
    
    def _build_generation_prompt(self, query: str, context: list) -> str:
        """Build code generation prompt."""
        context_str = "\n\n".join([
            f"[{i+1}] {item.get('file_path', 'unknown')}:\n{item.get('content', '')}"
            for i, item in enumerate(context[:5])
        ]) if context else "No existing code context."
        
        return f"""Request: {query}

Existing Codebase Context:
{context_str}

Provide code suggestions or refactoring recommendations that:
1. Follow the existing code style and patterns
2. Are well-documented with comments
3. Include error handling
4. Are production-ready
5. Explain the approach and trade-offs

Your response:"""
    
    def _get_system_prompt(self) -> str:
        """Get system prompt."""
        return """You are a code generation expert helping students build quality code.
Provide clear, well-documented code with explanations."""
