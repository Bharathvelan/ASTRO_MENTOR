"""LangGraph agent orchestrator."""

import logging
from datetime import datetime
from typing import Dict, List, TypedDict, TYPE_CHECKING
from langgraph.graph import StateGraph, END

from .tutor import TutorAgent
from .debugger import DebuggerAgent
from .builder import BuilderAgent
from .verifier import VerifierAgent

if TYPE_CHECKING:
    from src.services.bedrock.client import BedrockClient
    from src.services.rag.pipeline import RAGPipeline
    from src.services.irt.engine import IRTEngine
    from src.db.dynamodb import DynamoDBClient

logger = logging.getLogger(__name__)


class AgentState(TypedDict):
    """State for agent workflow."""
    query: str
    intent: str
    user_id: str
    repo_id: str
    session_id: str
    conversation_history: List[Dict]
    retrieved_context: List[Dict]
    agent_response: str
    metadata: Dict


class AgentOrchestrator:
    """Orchestrates multi-agent workflow using LangGraph."""
    
    def __init__(
        self,
        bedrock_client: "BedrockClient",
        rag_pipeline: "RAGPipeline",
        irt_engine: "IRTEngine",
        dynamodb_client: "DynamoDBClient",
    ):
        """Initialize orchestrator.
        
        Args:
            bedrock_client: Bedrock client
            rag_pipeline: RAG pipeline for context retrieval
            irt_engine: IRT engine for skill adaptation
            dynamodb_client: DynamoDB for conversation storage
        """
        self.bedrock = bedrock_client
        self.rag = rag_pipeline
        self.irt = irt_engine
        self.dynamodb = dynamodb_client
        
        # Initialize agents
        self.tutor = TutorAgent(bedrock_client, irt_engine)
        self.debugger = DebuggerAgent(bedrock_client)
        self.builder = BuilderAgent(bedrock_client)
        self.verifier = VerifierAgent(bedrock_client)
        
        # Build workflow graph
        self.graph = self._build_graph()

    
    def _build_graph(self) -> StateGraph:
        """Build LangGraph workflow."""
        graph = StateGraph(AgentState)
        
        # Add nodes
        graph.add_node("classify_intent", self._classify_intent)
        graph.add_node("retrieve_context", self._retrieve_context)
        graph.add_node("tutor", self._run_tutor)
        graph.add_node("debugger", self._run_debugger)
        graph.add_node("builder", self._run_builder)
        graph.add_node("verifier", self._run_verifier)
        graph.add_node("store_interaction", self._store_interaction)
        
        # Add edges
        graph.add_edge("classify_intent", "retrieve_context")
        graph.add_conditional_edges(
            "retrieve_context",
            self._route_to_agent,
            {
                "tutor": "tutor",
                "debugger": "debugger",
                "builder": "builder",
                "verifier": "verifier",
            }
        )
        graph.add_edge("tutor", "store_interaction")
        graph.add_edge("debugger", "store_interaction")
        graph.add_edge("builder", "store_interaction")
        graph.add_edge("verifier", "store_interaction")
        graph.add_edge("store_interaction", END)
        
        # Set entry point
        graph.set_entry_point("classify_intent")
        
        return graph.compile()
    
    async def process_query(
        self,
        query: str,
        user_id: str,
        session_id: str,
        repo_id: str = None,
    ) -> Dict:
        """Process user query through agent workflow.
        
        Args:
            query: User query
            user_id: User ID
            session_id: Session ID
            repo_id: Optional repository ID
            
        Returns:
            Agent response with metadata
        """
        # Get conversation history
        history = await self._get_conversation_history(session_id)
        
        # Initialize state
        state = AgentState(
            query=query,
            intent="",
            user_id=user_id,
            repo_id=repo_id or "",
            session_id=session_id,
            conversation_history=history,
            retrieved_context=[],
            agent_response="",
            metadata={},
        )
        
        # Execute workflow
        result = await self.graph.ainvoke(state)
        
        return {
            "response": result["agent_response"],
            "intent": result["intent"],
            "metadata": result["metadata"],
        }

    
    async def _classify_intent(self, state: AgentState) -> AgentState:
        """Classify query intent."""
        query = state["query"].lower()
        
        # Simple keyword-based classification
        if any(word in query for word in ["error", "bug", "exception", "crash", "fail"]):
            intent = "debugger"
        elif any(word in query for word in ["build", "create", "generate", "implement", "write"]):
            intent = "builder"
        elif any(word in query for word in ["test", "verify", "validate", "check"]):
            intent = "verifier"
        else:
            intent = "tutor"  # Default to tutor
        
        state["intent"] = intent
        logger.info(f"Classified intent: {intent}")
        return state
    
    async def _retrieve_context(self, state: AgentState) -> AgentState:
        """Retrieve context using RAG pipeline."""
        if state["repo_id"]:
            try:
                result = await self.rag.retrieve(
                    query=state["query"],
                    repo_id=state["repo_id"],
                    top_k=10,
                    max_tokens=6000,
                )
                state["retrieved_context"] = result["context"]
                logger.info(f"Retrieved {len(result['context'])} context items")
            except Exception as e:
                logger.error(f"Context retrieval failed: {e}")
                state["retrieved_context"] = []
        
        return state
    
    def _route_to_agent(self, state: AgentState) -> str:
        """Route to appropriate agent based on intent."""
        return state["intent"]
    
    async def _run_tutor(self, state: AgentState) -> AgentState:
        """Run tutor agent."""
        response = await self.tutor.process(state)
        state["agent_response"] = response
        state["metadata"]["agent"] = "tutor"
        return state
    
    async def _run_debugger(self, state: AgentState) -> AgentState:
        """Run debugger agent."""
        response = await self.debugger.process(state)
        state["agent_response"] = response
        state["metadata"]["agent"] = "debugger"
        return state
    
    async def _run_builder(self, state: AgentState) -> AgentState:
        """Run builder agent."""
        response = await self.builder.process(state)
        state["agent_response"] = response
        state["metadata"]["agent"] = "builder"
        return state
    
    async def _run_verifier(self, state: AgentState) -> AgentState:
        """Run verifier agent."""
        response = await self.verifier.process(state)
        state["agent_response"] = response
        state["metadata"]["agent"] = "verifier"
        return state
    
    async def _store_interaction(self, state: AgentState) -> AgentState:
        """Store interaction in DynamoDB."""
        try:
            await self.dynamodb.put_item(
                table_name="agent_interactions",
                item={
                    "user_id": state["user_id"],
                    "session_id": state["session_id"],
                    "timestamp": datetime.utcnow().isoformat(),
                    "query": state["query"],
                    "response": state["agent_response"],
                    "intent": state["intent"],
                    "agent": state["metadata"].get("agent"),
                }
            )
            logger.info("Stored interaction in DynamoDB")
        except Exception as e:
            logger.error(f"Failed to store interaction: {e}")
        
        return state
    
    async def _get_conversation_history(self, session_id: str) -> List[Dict]:
        """Get conversation history from DynamoDB."""
        try:
            items = await self.dynamodb.query_items(
                table_name="chat_messages",
                key_condition="session_id = :sid",
                expression_values={":sid": session_id},
                limit=10,
            )
            
            return [
                {
                    "role": item.get("role"),
                    "content": item.get("content"),
                }
                for item in items
            ]
        except Exception as e:
            logger.error(f"Failed to get history: {e}")
            return []
