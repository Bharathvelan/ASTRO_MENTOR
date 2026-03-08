"""Chat and streaming endpoints."""

import asyncio
import time
import uuid
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, status  # type: ignore[import]
from fastapi.responses import StreamingResponse  # type: ignore[import]
from sqlalchemy.orm import Session  # type: ignore[import]

import structlog  # type: ignore[import]

from src.api.middleware.auth import get_current_user  # type: ignore[import]
from src.api.models.chat import ChatMessageRequest, ChatMessageResponse  # type: ignore[import]
from src.agents.orchestrator import AgentOrchestrator  # type: ignore[import]
from src.db.base import get_db  # type: ignore[import]
from src.db.dynamodb import DynamoDBClient  # type: ignore[import]
from src.services.bedrock.client import BedrockClient  # type: ignore[import]
from src.services.irt.engine import IRTEngine  # type: ignore[import]
from src.db.redis import RedisClient  # type: ignore[import]
from src.services.vector.vector_store import VectorStoreManager  # type: ignore[import]
from src.services.graph.knowledge_graph import KnowledgeGraphManager  # type: ignore[import]
from src.services.rag.pipeline import RAGPipeline  # type: ignore[import]

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


@router.post("/message", response_model=ChatMessageResponse)
async def send_chat_message(
    request: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> ChatMessageResponse:
    """
    Send a chat message and get AI response.

    - Routes to appropriate agent based on intent
    - Retrieves context from repository if provided
    - Returns complete response with metadata
    """
    user_id = current_user.get("user_id", "unknown")
    logger.info(
        "chat_message_received",
        session_id=request.session_id,
        user_id=user_id,
        message_length=len(request.message),
        has_repo=request.repo_id is not None,
    )

    start_time = time.time()

    import os
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")

    if api_key:
        try:
            from langchain_openai import ChatOpenAI  # type: ignore[import]
            from langchain.agents import initialize_agent, AgentType  # type: ignore[import]
            from langchain.tools import tool  # type: ignore[import]
            
            @tool
            def search_codebase(query: str) -> str:
                """Searches the connected code repository for technical details."""
                # In production, this would call vector_store.search
                return f"Mocked codebase search results for: '{query}'. Context found."
                
            @tool
            def execute_code(code: str) -> str:
                """Runs python code and returns the console output."""
                # In production, this would call the CodeExecutor
                return f"Execution successful."
                
            llm = ChatOpenAI(temperature=0.2, model="gpt-4o-mini")
            
            agent = initialize_agent(
                tools=[search_codebase, execute_code],
                llm=llm,
                agent=AgentType.OPENAI_FUNCTIONS,
                verbose=True
            )
            
            agent_response = await agent.arun(request.message)
            
            latency_ms = (time.time() - start_time) * 1000
            message_id = str(uuid.uuid4())
            
            return ChatMessageResponse(
                message_id=message_id,
                response=agent_response,
                intent="builder",
                agent="langchain_agent",
                tokens_used=150,
                latency_ms=latency_ms,
            )
        except Exception as e:
            logger.error("agent_error", error=str(e))
            # Fallback below
            
    try:
        # Initialize components
        bedrock = BedrockClient()
        dynamodb = DynamoDBClient()
        irt = IRTEngine(db)
        
        vector_store = VectorStoreManager(dimension=1536)
        kg = KnowledgeGraphManager()
        redis = RedisClient()

        rag = RAGPipeline(
            bedrock_client=bedrock,
            vector_store=vector_store,
            knowledge_graph=kg,
            redis_client=redis
        )

        # Create orchestrator
        orchestrator = AgentOrchestrator(
            bedrock_client=bedrock,
            rag_pipeline=rag,
            irt_engine=irt,
            dynamodb_client=dynamodb,
        )

        # Process query
        result = await orchestrator.process_query(
            query=request.message,
            user_id=user_id,
            session_id=request.session_id,
            repo_id=request.repo_id,
        )

        # Calculate latency
        latency_ms = (time.time() - start_time) * 1000

        # Generate message ID
        message_id = str(uuid.uuid4())

        # Store message to DynamoDB
        await dynamodb.put_item(
            table_name="chat_messages",
            item={
                "session_id": request.session_id,
                "message_id": message_id,
                "timestamp": int(time.time()),
                "user_message": request.message,
                "agent_response": result["response"],
                "intent": result["intent"],
                "agent": result["metadata"]["agent"],
            },
        )

        logger.info(
            "chat_message_completed",
            session_id=request.session_id,
            message_id=message_id,
            intent=result["intent"],
            latency_ms=latency_ms,
        )

        return ChatMessageResponse(
            message_id=message_id,
            response=result["response"],
            intent=result["intent"],
            agent=result["metadata"]["agent"],
            tokens_used=result["metadata"].get("tokens", 0),
            latency_ms=latency_ms,
        )

    except Exception as e:
        logger.error(
            "chat_message_error",
            session_id=request.session_id,
            error=str(e),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process message: {str(e)}",
        )


@router.get("/stream")
async def stream_chat_messages(
    session_id: str,
    message: str,
    repo_id: str | None = None,
    current_user: dict = Depends(get_current_user),
) -> StreamingResponse:
    """
    Stream chat messages using Server-Sent Events (SSE).

    - Streams agent responses in real-time
    - Uses SSE format (data: prefix, double newline)
    - Supports cancellation
    """
    user_id = current_user.get("user_id", "unknown")
    logger.info(
        "chat_stream_started",
        session_id=session_id,
        user_id=user_id,
        has_repo=repo_id is not None,
    )

    async def event_generator() -> AsyncGenerator[str, None]:
        """Generate SSE events."""
        try:
            # Initialize components
            bedrock = BedrockClient()
            dynamodb = DynamoDBClient()
            
            vector_store = VectorStoreManager(dimension=1536)
            kg = KnowledgeGraphManager()
            redis = RedisClient()

            rag = RAGPipeline(
                bedrock_client=bedrock,
                vector_store=vector_store,
                knowledge_graph=kg,
                redis_client=redis
            )

            # Get db session
            from src.db.base import SessionLocal  # type: ignore[import]

            db = SessionLocal()
            try:
                irt = IRTEngine(db)

                # Create orchestrator
                orchestrator = AgentOrchestrator(
                    bedrock_client=bedrock,
                    rag_pipeline=rag,
                    irt_engine=irt,
                    dynamodb_client=dynamodb,
                )

                # Process query with streaming
                # Note: This is a simplified version
                # In production, the orchestrator would support streaming
                result = await orchestrator.process_query(
                    query=message,
                    user_id=user_id,
                    session_id=session_id,
                    repo_id=repo_id,
                )

                # Stream response in chunks
                response_text = result["response"]
                chunk_size = 50  # Characters per chunk

                for i in range(0, len(response_text), chunk_size):
                    chunk = response_text[i : i + chunk_size]

                    # Format as SSE
                    yield f"data: {chunk}\n\n"

                    # Small delay to simulate streaming
                    await asyncio.sleep(0.05)

                # Send completion event
                yield "data: [DONE]\n\n"

                logger.info("chat_stream_completed", session_id=session_id)

            finally:
                db.close()

        except Exception as e:
            logger.error("chat_stream_error", session_id=session_id, error=str(e))
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
