"""Debugger agent for error analysis."""

import logging
import re
from typing import Dict

from .base import BaseAgent

logger = logging.getLogger(__name__)


class DebuggerAgent(BaseAgent):
    """Agent for analyzing errors and providing debugging guidance."""
    
    async def process(self, state: Dict) -> str:
        """Analyze error and provide progressive hints.
        
        Args:
            state: Agent state with query and context
            
        Returns:
            Debugging guidance
        """
        query = state.get("query", "")
        context = state.get("retrieved_context", [])
        
        # Extract error information
        error_info = self._extract_error_info(query)
        
        # Build debug prompt
        prompt = self._build_debug_prompt(error_info, context)
        
        # Generate response
        response = await self.bedrock.invoke_claude_sonnet(
            prompt=prompt,
            system_prompt=self._get_system_prompt(),
            max_tokens=2048,
            temperature=0.7,
        )
        
        return response
    
    def _extract_error_info(self, query: str) -> Dict:
        """Extract error information from query."""
        error_info = {
            "error_type": None,
            "error_message": None,
            "stack_trace": None,
        }
        
        # Try to extract error type
        error_patterns = [
            r'(\w+Error):',
            r'(\w+Exception):',
            r'Error:\s*(\w+)',
        ]
        
        for pattern in error_patterns:
            match = re.search(pattern, query)
            if match:
                error_info["error_type"] = match.group(1)
                break
        
        # Extract error message (text after error type)
        if error_info["error_type"]:
            msg_pattern = f'{error_info["error_type"]}:(.+?)(?:\n|$)'
            match = re.search(msg_pattern, query)
            if match:
                error_info["error_message"] = match.group(1).strip()
        
        return error_info
    
    def _build_debug_prompt(self, error_info: Dict, context: list) -> str:
        """Build debugging prompt."""
        context_str = "\n\n".join([
            f"[{i+1}] {item.get('content', '')}"
            for i, item in enumerate(context[:3])
        ]) if context else "No code context available."
        
        error_type = error_info.get("error_type", "Unknown")
        error_msg = error_info.get("error_message", "")
        
        return f"""Error Type: {error_type}
Error Message: {error_msg}

Relevant Code Context:
{context_str}

Analyze this error and provide:
1. Root cause explanation
2. Progressive hints (start with high-level, then more specific)
3. Common mistakes that lead to this error
4. Suggested debugging steps

Focus on helping the user understand WHY the error occurred."""
    
    def _get_system_prompt(self) -> str:
        """Get system prompt."""
        return """You are a debugging expert helping students understand errors.
Provide clear explanations of root causes and progressive hints."""
