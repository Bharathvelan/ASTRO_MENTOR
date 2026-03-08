"""Base agent class."""

import logging
from abc import ABC, abstractmethod
from typing import Dict, TYPE_CHECKING

if TYPE_CHECKING:
    from src.services.bedrock.client import BedrockClient

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Base class for all agents."""
    
    def __init__(self, bedrock_client: "BedrockClient"):
        """Initialize base agent.
        
        Args:
            bedrock_client: Bedrock client for AI operations
        """
        self.bedrock = bedrock_client
        self.agent_type = self.__class__.__name__
    
    @abstractmethod
    async def process(self, state: Dict) -> str:
        """Process agent request.
        
        Args:
            state: Agent state with query, context, history
            
        Returns:
            Agent response
        """
        pass
    
    def _build_prompt(self, template: str, **kwargs) -> str:
        """Build prompt from template.
        
        Args:
            template: Prompt template
            **kwargs: Template variables
            
        Returns:
            Formatted prompt
        """
        try:
            return template.format(**kwargs)
        except KeyError as e:
            logger.error(f"Missing template variable: {e}")
            return template
