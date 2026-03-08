"""Tutor agent for Socratic questioning."""

import logging
from typing import Dict, TYPE_CHECKING

from .base import BaseAgent

if TYPE_CHECKING:
    from src.services.bedrock.client import BedrockClient
    from src.services.irt.engine import IRTEngine

logger = logging.getLogger(__name__)


class TutorAgent(BaseAgent):
    """Socratic tutor agent that guides without giving direct answers."""
    
    def __init__(self, bedrock_client: "BedrockClient", irt_engine: "IRTEngine"):
        """Initialize tutor agent.
        
        Args:
            bedrock_client: Bedrock client
            irt_engine: IRT engine for skill adaptation
        """
        super().__init__(bedrock_client)
        self.irt = irt_engine
    
    async def process(self, state: Dict) -> str:
        """Generate Socratic response based on user skill level.
        
        Args:
            state: Agent state with query, context, user_id, etc.
            
        Returns:
            Socratic guiding response
        """
        query = state.get("query", "")
        user_id = state.get("user_id", "")
        context = state.get("retrieved_context", [])
        history = state.get("conversation_history", [])
        
        # Get user skill level
        skill_level = self.irt.get_user_skill(user_id) if user_id else 0.0
        
        # Build Socratic prompt
        prompt = self._build_socratic_prompt(
            query=query,
            skill_level=skill_level,
            context=context,
            history=history,
        )
        
        # Generate response with Claude Sonnet
        response = await self.bedrock.invoke_claude_sonnet(
            prompt=prompt,
            system_prompt=self._get_system_prompt(),
            max_tokens=2048,
            temperature=0.7,
            stream=False,
        )
        
        return response

    
    def _build_socratic_prompt(
        self,
        query: str,
        skill_level: float,
        context: list,
        history: list,
    ) -> str:
        """Build Socratic prompt.
        
        Args:
            query: User query
            skill_level: User skill level (-3 to +3)
            context: Retrieved code context
            history: Conversation history
            
        Returns:
            Formatted prompt
        """
        # Format context
        context_str = self._format_context(context)
        
        # Format history
        history_str = self._format_history(history)
        
        # Adjust guidance based on skill level
        if skill_level < -1:
            guidance = "Provide more detailed hints and break down concepts into smaller steps."
        elif skill_level > 1:
            guidance = "Ask more challenging questions that require deeper thinking."
        else:
            guidance = "Balance between guidance and challenge."
        
        prompt = f"""Student Question: {query}

Student Skill Level: {skill_level:.1f}/3.0 (where 0 is average)
Guidance Strategy: {guidance}

Relevant Code Context:
{context_str}

Conversation History:
{history_str}

Your task: Guide the student to discover the answer through Socratic questioning.
- Ask guiding questions that help them think through the problem
- Provide hints that point them in the right direction
- Do NOT give direct answers or complete solutions
- Encourage them to explore and experiment
- Adapt your questions to their skill level

Your response:"""
        
        return prompt
    
    def _get_system_prompt(self) -> str:
        """Get system prompt for tutor agent."""
        return """You are a Socratic tutor helping students learn programming.
Your goal is to guide students to discover answers themselves through questioning.
Never give direct answers. Instead, ask questions that help them think critically."""
    
    def _format_context(self, context: list) -> str:
        """Format retrieved context."""
        if not context:
            return "No specific code context available."
        
        formatted = []
        for i, item in enumerate(context[:5], 1):  # Limit to top 5
            content = item.get("content", "")
            file_path = item.get("file_path", "unknown")
            formatted.append(f"[{i}] From {file_path}:\n{content}")
        
        return "\n\n".join(formatted)
    
    def _format_history(self, history: list) -> str:
        """Format conversation history."""
        if not history:
            return "No previous conversation."
        
        formatted = []
        for msg in history[-5:]:  # Last 5 messages
            role = msg.get("role", "user")
            content = msg.get("content", "")
            formatted.append(f"{role.capitalize()}: {content}")
        
        return "\n".join(formatted)
