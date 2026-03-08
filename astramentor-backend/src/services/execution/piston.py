import httpx
import structlog
from typing import Dict, Any, List

logger = structlog.get_logger(__name__)

PISTON_API_URL = "https://emkc.org/api/v2/piston"

# Map frontend language strings to Piston languages
LANGUAGE_MAP = {
    "python": "python",
    "javascript": "javascript",
    "typescript": "typescript",
    "java": "java",
    "cpp": "cpp",
    "c": "c",
    "go": "go",
    "rust": "rust"
}

# Map language to roughly latest piston version
# Ideally we'd fetch these from /api/v2/piston/runtimes, but hardcoding for simplicity
VERSION_MAP = {
    "python": "3.10.0",
    "javascript": "18.15.0",
    "typescript": "5.0.3",
    "java": "15.0.2",
    "cpp": "10.2.0",
    "c": "10.2.0",
    "go": "1.16.2",
    "rust": "1.68.2"
}

class CodeExecutionException(Exception):
    pass

async def execute_code(language: str, code: str, args: List[str] | None = None, stdin: str | None = None) -> Dict[str, Any]:
    """Execute code using the public Piston API."""
    piston_lang = LANGUAGE_MAP.get(language, language)
    version = VERSION_MAP.get(piston_lang, "*")
    
    payload: Dict[str, Any] = {
        "language": piston_lang,
        "version": version,
        "files": [{"content": code}],
    }
    
    if args:
        payload["args"] = args
    if stdin:
        payload["stdin"] = stdin
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{PISTON_API_URL}/execute",
                json=payload,
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            
            run_result = data.get("run", {})
            return {
                "stdout": run_result.get("stdout", ""),
                "stderr": run_result.get("stderr", ""),
                "code": run_result.get("code", 1), # exit code
                "output": run_result.get("output", "")
            }
            
    except httpx.HTTPStatusError as e:
        logger.error("piston_api_error", status_code=e.response.status_code, text=e.response.text)
        raise CodeExecutionException(f"Execution API error: {e.response.status_code}")
    except Exception as e:
        logger.error("piston_execution_error", error=str(e))
        return {
            "stdout": "",
            "stderr": "Unknown Error",
            "code": -1,
            "output": ""
        }
