"""Verifier agent for test generation and code validation."""

import logging
from typing import Dict

from .base import BaseAgent

logger = logging.getLogger(__name__)


class VerifierAgent(BaseAgent):
    """Agent for test generation and code quality validation."""
    
    async def process(self, state: Dict) -> str:
        """Generate tests and validate code quality.
        
        Args:
            state: Agent state
            
        Returns:
            Verification results and test cases
        """
        query = state.get("query", "")
        context = state.get("retrieved_context", [])
        
        # Extract code to verify
        code = self._extract_code(query)
        
        # Build verification prompt
        prompt = self._build_verification_prompt(code, context)
        
        # Generate response
        response = await self.bedrock.invoke_claude_sonnet(
            prompt=prompt,
            system_prompt=self._get_system_prompt(),
            max_tokens=3072,
            temperature=0.7,
        )
        
        return response
    
    def _extract_code(self, query: str) -> str:
        """Extract code from query."""
        # Look for code blocks
        import re
        code_pattern = r'```(?:\w+)?\n(.*?)```'
        matches = re.findall(code_pattern, query, re.DOTALL)
        
        if matches:
            return matches[0]
        
        # If no code blocks, return full query
        return query
    
    def _build_verification_prompt(self, code: str, context: list) -> str:
        """Build verification prompt."""
        context_str = "\n\n".join([
            f"[{i+1}] {item.get('content', '')}"
            for i, item in enumerate(context[:3])
        ]) if context else "No context available."
        
        return f"""Code to Verify:
```
{code}
```

Related Code Context:
{context_str}

Provide:
1. Code quality analysis (readability, maintainability, performance)
2. Potential bugs or issues
3. Test cases (unit tests with assertions)
4. Edge cases to consider
5. Suggestions for improvement

Format test cases clearly with expected inputs and outputs."""
    
    def _get_system_prompt(self) -> str:
        """Get system prompt."""
        return """You are a code verification expert helping students write quality code.
Generate comprehensive test cases and provide constructive feedback."""
