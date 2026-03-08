"""AWS Bedrock client for Claude and Titan models."""

import json
import logging
from typing import AsyncIterator, Dict, List, Optional
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError

from src.utils.retry import retry_with_backoff

logger = logging.getLogger(__name__)


class BedrockClient:
    """Client for AWS Bedrock API with Claude and Titan models."""
    
    # Model IDs
    CLAUDE_SONNET_MODEL = "anthropic.claude-3-5-sonnet-20241022-v2:0"
    CLAUDE_HAIKU_MODEL = "anthropic.claude-3-haiku-20240307-v1:0"
    TITAN_EMBEDDINGS_MODEL = "amazon.titan-embed-text-v1"
    
    # Pricing per 1K tokens (USD)
    SONNET_INPUT_PRICE = Decimal("0.003")
    SONNET_OUTPUT_PRICE = Decimal("0.015")
    HAIKU_INPUT_PRICE = Decimal("0.00025")
    HAIKU_OUTPUT_PRICE = Decimal("0.00125")
    TITAN_EMBEDDINGS_PRICE = Decimal("0.0001")
    
    def __init__(self, region_name: str = "us-east-1"):
        """Initialize Bedrock client.
        
        Args:
            region_name: AWS region for Bedrock service
        """
        self.client = boto3.client("bedrock-runtime", region_name=region_name)
        self.total_cost = Decimal("0")
        self.request_count = 0
        
    @retry_with_backoff(max_retries=3, base_delay=1.0)
    async def invoke_claude_sonnet(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
        stream: bool = False,
    ) -> str | AsyncIterator[str]:
        """Invoke Claude 3.5 Sonnet for complex reasoning.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0-1)
            stream: Whether to stream the response
            
        Returns:
            Generated text or async iterator of text chunks
        """
        return await self._invoke_claude(
            model_id=self.CLAUDE_SONNET_MODEL,
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=stream,
            input_price=self.SONNET_INPUT_PRICE,
            output_price=self.SONNET_OUTPUT_PRICE,
        )
    
    @retry_with_backoff(max_retries=3, base_delay=1.0)
    async def invoke_claude_haiku(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 2048,
        temperature: float = 0.7,
        stream: bool = False,
    ) -> str | AsyncIterator[str]:
        """Invoke Claude 3 Haiku for fast responses.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0-1)
            stream: Whether to stream the response
            
        Returns:
            Generated text or async iterator of text chunks
        """
        return await self._invoke_claude(
            model_id=self.CLAUDE_HAIKU_MODEL,
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=stream,
            input_price=self.HAIKU_INPUT_PRICE,
            output_price=self.HAIKU_OUTPUT_PRICE,
        )
    
    async def _invoke_claude(
        self,
        model_id: str,
        prompt: str,
        system_prompt: Optional[str],
        max_tokens: int,
        temperature: float,
        stream: bool,
        input_price: Decimal,
        output_price: Decimal,
    ) -> str | AsyncIterator[str]:
        """Internal method to invoke Claude models.
        
        Args:
            model_id: Bedrock model ID
            prompt: User prompt
            system_prompt: Optional system prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            stream: Whether to stream
            input_price: Price per 1K input tokens
            output_price: Price per 1K output tokens
            
        Returns:
            Generated text or async iterator
        """
        # Build request body
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        }
        
        if system_prompt:
            body["system"] = system_prompt
        
        try:
            if stream:
                return self._stream_claude_response(
                    model_id, body, input_price, output_price
                )
            else:
                response = self.client.invoke_model(
                    modelId=model_id,
                    body=json.dumps(body),
                )
                
                response_body = json.loads(response["body"].read())
                
                # Track cost
                input_tokens = response_body.get("usage", {}).get("input_tokens", 0)
                output_tokens = response_body.get("usage", {}).get("output_tokens", 0)
                self._track_cost(input_tokens, output_tokens, input_price, output_price)
                
                # Extract text from response
                content = response_body.get("content", [])
                if content and len(content) > 0:
                    return content[0].get("text", "")
                return ""
                
        except ClientError as e:
            logger.error(f"Bedrock API error: {e}")
            raise
    
    async def _stream_claude_response(
        self,
        model_id: str,
        body: Dict,
        input_price: Decimal,
        output_price: Decimal,
    ) -> AsyncIterator[str]:
        """Stream Claude response chunks.
        
        Args:
            model_id: Bedrock model ID
            body: Request body
            input_price: Price per 1K input tokens
            output_price: Price per 1K output tokens
            
        Yields:
            Text chunks from streaming response
        """
        try:
            response = self.client.invoke_model_with_response_stream(
                modelId=model_id,
                body=json.dumps(body),
            )
            
            input_tokens = 0
            output_tokens = 0
            
            for event in response["body"]:
                chunk = json.loads(event["chunk"]["bytes"])
                
                # Handle different event types
                if chunk.get("type") == "message_start":
                    usage = chunk.get("message", {}).get("usage", {})
                    input_tokens = usage.get("input_tokens", 0)
                
                elif chunk.get("type") == "content_block_delta":
                    delta = chunk.get("delta", {})
                    if delta.get("type") == "text_delta":
                        text = delta.get("text", "")
                        if text:
                            yield text
                
                elif chunk.get("type") == "message_delta":
                    usage = chunk.get("usage", {})
                    output_tokens = usage.get("output_tokens", 0)
            
            # Track cost after streaming completes
            self._track_cost(input_tokens, output_tokens, input_price, output_price)
            
        except ClientError as e:
            logger.error(f"Bedrock streaming error: {e}")
            raise
    
    @retry_with_backoff(max_retries=3, base_delay=1.0)
    async def get_embedding(self, text: str) -> List[float]:
        """Generate embedding using Titan Embeddings.
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector (1536 dimensions)
        """
        body = json.dumps({"inputText": text})
        
        try:
            response = self.client.invoke_model(
                modelId=self.TITAN_EMBEDDINGS_MODEL,
                body=body,
            )
            
            response_body = json.loads(response["body"].read())
            embedding = response_body.get("embedding", [])
            
            # Track cost (approximate token count)
            token_count = len(text.split())
            cost = (Decimal(token_count) / 1000) * self.TITAN_EMBEDDINGS_PRICE
            self.total_cost += cost
            self.request_count += 1
            
            logger.debug(f"Generated embedding, cost: ${cost:.6f}")
            
            return embedding
            
        except ClientError as e:
            logger.error(f"Titan embeddings error: {e}")
            raise
    
    async def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        embeddings = []
        for text in texts:
            embedding = await self.get_embedding(text)
            embeddings.append(embedding)
        return embeddings
    
    def route_model(self, query: str, complexity_threshold: int = 100) -> str:
        """Route query to appropriate model based on complexity.
        
        Args:
            query: User query
            complexity_threshold: Word count threshold for Sonnet
            
        Returns:
            Model ID to use
        """
        word_count = len(query.split())
        
        # Use Sonnet for complex queries, Haiku for simple ones
        if word_count > complexity_threshold:
            return self.CLAUDE_SONNET_MODEL
        return self.CLAUDE_HAIKU_MODEL
    
    def _track_cost(
        self,
        input_tokens: int,
        output_tokens: int,
        input_price: Decimal,
        output_price: Decimal,
    ):
        """Track API costs.
        
        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            input_price: Price per 1K input tokens
            output_price: Price per 1K output tokens
        """
        input_cost = (Decimal(input_tokens) / 1000) * input_price
        output_cost = (Decimal(output_tokens) / 1000) * output_price
        total = input_cost + output_cost
        
        self.total_cost += total
        self.request_count += 1
        
        logger.info(
            f"Bedrock request cost: ${total:.6f} "
            f"(input: {input_tokens}, output: {output_tokens}). "
            f"Total cost: ${self.total_cost:.2f}"
        )
    
    def get_total_cost(self) -> Decimal:
        """Get total accumulated cost.
        
        Returns:
            Total cost in USD
        """
        return self.total_cost
    
    def get_request_count(self) -> int:
        """Get total request count.
        
        Returns:
            Number of requests made
        """
        return self.request_count
    
    def reset_cost_tracking(self):
        """Reset cost tracking counters."""
        self.total_cost = Decimal("0")
        self.request_count = 0
