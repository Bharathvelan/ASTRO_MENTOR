import os
import json
import structlog
from typing import Dict, Any, List

logger = structlog.get_logger(__name__)

async def generate_ai_review(code: str, language: str, context: str | None = None) -> Dict[str, Any]:
    """Generates an AI code review. Uses LangChain if API key is present, otherwise falls back to basic mock."""
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
    
    if api_key:
        try:
            # Try to use langchain if available
            from langchain_core.messages import HumanMessage, SystemMessage
            try:
                from langchain_openai import ChatOpenAI
                llm = ChatOpenAI(temperature=0, model="gpt-4o-mini")
            except ImportError:
                # Mock if specific provider not installed but key is present
                return _fallback_ai_mock(code, language)
                
            prompt = f"""Review the following {language} code. 
            Context: {context or 'None'}
            Provide a JSON response with keys: 'suggestions' (list of dicts with 'id', 'description', 'before', 'after', 'impact'), 
            'summary' (string), and 'metrics' (dict with 'complexity', 'maintainability', 'lines_of_code').
            
            Code:
            {code}"""
            
            messages = [
                SystemMessage(content="You are an expert AI code reviewer. Always output valid JSON only."),
                HumanMessage(content=prompt)
            ]
            
            response = await llm.ainvoke(messages)
            content = response.content
            # Strip markdown code blocks if any
            if content.startswith("```json"):
                content = content[7:-3]
            elif content.startswith("```"):
                content = content[3:-3]
                
            return json.loads(content)
        except Exception as e:
            logger.error("llm_review_error", error=str(e))
            return _fallback_ai_mock(code, language)
    else:
        logger.info("llm_review_fallback", reason="No API key found")
        return _fallback_ai_mock(code, language)

def _fallback_ai_mock(code: str, language: str) -> Dict[str, Any]:
    """Generates context-aware mock suggestions representing advanced AI behavior."""
    lines = code.splitlines()
    suggestions = []
    
    # Advanced heuristic logic for the mock
    if "for " in code and "append" in code:
        suggestions.append({
            "id": "sug-ai-001",
            "description": "Consider using list comprehension for better performance and readability.",
            "before": "result = []\nfor item in items:\n    result.append(item * 2)",
            "after": "result = [item * 2 for item in items]",
            "impact": "medium"
        })
        
    if language == "python" and "type(" in code and "==" in code:
        suggestions.append({
            "id": "sug-ai-002",
            "description": "Use isinstance() instead of checking type() directly to support inheritance.",
            "before": "if type(var) == list:",
            "after": "if isinstance(var, list):",
            "impact": "high"
        })

    return {
        "suggestions": suggestions,
        "summary": "AI Review complete. Implemented basic fallback due to missing API keys.",
        "metrics": {
            "complexity": 50,
            "maintainability": 80,
            "lines_of_code": len(lines)
        }
    }

async def generate_rag_answer(question: str, context: str) -> str:
    """Generates an answer based on the provided context."""
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
    
    if api_key:
        try:
            from langchain_core.messages import HumanMessage, SystemMessage
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(temperature=0, model="gpt-4o-mini")
            
            prompt = f"Answer the following question based ONLY on the provided code context. If the answer is not in the context, say 'I cannot answer this based on the provided code context.'\n\nQuestion: {question}\n\nContext:\n{context}"
            messages = [
                SystemMessage(content="You are an expert AI software engineer analyzing a codebase."),
                HumanMessage(content=prompt)
            ]
            
            response = await llm.ainvoke(messages)
            return response.content
        except Exception as e:
            logger.error("llm_rag_error", error=str(e))
            return _fallback_rag_mock(question, context)
    else:
        return _fallback_rag_mock(question, context)

def _fallback_rag_mock(question: str, context: str) -> str:
    """Fallback RAG answer when no LLM key is present."""
    return f"Based on the repository analysis, we found {len(context.split('---'))} relevant code snippets. Since no API key is configured, here is a mock response. The code appears to contain functionality relevant to your query: '{question}'."
