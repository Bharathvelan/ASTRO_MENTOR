"""AI Code Review API endpoints."""

from typing import Dict, Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
import structlog

from src.api.middleware.auth import get_current_user
from src.services.parser.ast_analyzer import analyze_python_ast
from src.services.reviewer.llm_reviewer import generate_ai_review

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1/review", tags=["review"])


class ReviewPayload(BaseModel):
    code: str = Field(..., max_length=15000)
    language: str = Field(..., max_length=20)
    context: str | None = Field(None, max_length=1000)


@router.get("/health")
async def review_health():
    """Health check for the review service."""
    return {"status": "ok", "service": "ai-code-review"}


@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_code(
    payload: ReviewPayload,
    current_user: dict = Depends(get_current_user),
):
    """
    Perform a comprehensive AI code review on the provided snippet.
    Returns metrics, line-level annotations, suggestions, and security issues.
    """
    user_id = current_user.get("user_id", "unknown")
    logger.info("review_analyze_requested", user_id=user_id, language=payload.language)

    code = payload.code
    code_lower = code.lower()
    lines = code.splitlines()
    line_count = len(lines)

    # ── Heuristic signals ──────────────────────────────────────
    has_type_hints = (":" in code and "->" in code) if payload.language == "python" else True
    has_comments = "#" in code or "//" in code or '"""' in code or "'''" in code
    has_docstring = '"""' in code or "'''" in code
    is_long = line_count > 30
    has_eval = "eval(" in code_lower or "exec(" in code_lower
    has_magic_numbers = any(
        tok.strip().lstrip("-").isdigit()
        and int(tok.strip().lstrip("-")) not in (0, 1, -1, 2)
        for tok in code.split()
        if tok.strip().lstrip("-").isdigit()
    )
    max_indent = max(
        (len(line) - len(line.lstrip()) for line in lines if line.strip()),
        default=0,
    )
    deeply_nested = max_indent >= 16
    has_bare_except = "except:" in code or "except exception:" in code_lower
    missing_error_handling = "try" not in code_lower and payload.language == "python" and is_long
    has_hardcoded_secret = any(
        kw in code_lower for kw in ("password =", "secret =", "api_key =", "token =")
    )
    has_sql_injection = "%" in code and ("execute" in code_lower or "query" in code_lower)
    has_shell_injection = "subprocess" in code_lower and "shell=true" in code_lower

    # ── Scores ────────────────────────────────────────────────
    quality_score = 100
    if not has_comments:
        quality_score -= 15
    if not has_type_hints:
        quality_score -= 10
    if not has_docstring:
        quality_score -= 10
    if is_long:
        quality_score -= 5
    quality_score = max(0, quality_score)

    security_score = 100
    if has_eval:
        security_score -= 50
    if has_hardcoded_secret:
        security_score -= 40
    if has_sql_injection:
        security_score -= 35
    if has_shell_injection:
        security_score -= 30
    security_score = max(0, security_score)

    performance_score = 100
    if deeply_nested:
        performance_score -= 20
    if is_long:
        performance_score -= 10
    performance_score = max(0, performance_score)

    style_score = 100
    if not has_comments:
        style_score -= 20
    if has_magic_numbers:
        style_score -= 15
    if has_bare_except:
        style_score -= 10
    style_score = max(0, style_score)

    overall_score = int((quality_score + security_score + performance_score + style_score) / 4)

    # ── Issues ────────────────────────────────────────────────
    issues = []
    if not has_comments:
        issues.append({
            "id": "style-001", "severity": "warning", "category": "style",
            "message": "No comments or docstrings found.",
            "line": 1, "column": 0,
            "suggestion": "Add a module docstring and inline comments for complex logic.",
        })
    if not has_type_hints and payload.language == "python":
        issues.append({
            "id": "quality-001", "severity": "info", "category": "quality",
            "message": "Functions lack type annotations.",
            "line": 1, "column": 0,
            "suggestion": "Add type hints to all function signatures for better readability.",
        })
    if has_magic_numbers:
        issues.append({
            "id": "style-002", "severity": "info", "category": "style",
            "message": "Magic numbers detected in code.",
            "line": 1, "column": 0,
            "suggestion": "Extract constants with descriptive names (e.g., MAX_RETRY = 3).",
        })
    if deeply_nested:
        issues.append({
            "id": "perf-001", "severity": "warning", "category": "performance",
            "message": "Code is deeply nested (4+ levels). This hurts readability and performance.",
            "line": 1, "column": 0,
            "suggestion": "Refactor using early returns or extract sub-functions.",
        })
    if has_bare_except:
        issues.append({
            "id": "quality-002", "severity": "warning", "category": "quality",
            "message": "Bare `except:` swallows all errors silently.",
            "line": 1, "column": 0,
            "suggestion": "Catch specific exception types and log them appropriately.",
        })
    if missing_error_handling:
        issues.append({
            "id": "quality-003", "severity": "info", "category": "quality",
            "message": "No error handling found in a large function.",
            "line": 1, "column": 0,
            "suggestion": "Wrap risky operations in try/except blocks.",
        })

    # ── Security issues ───────────────────────────────────────
    security_issues = []
    if has_eval:
        security_issues.append({
            "severity": "critical",
            "message": "Use of eval() or exec() is a critical security vulnerability.",
            "line": next(
                (i + 1 for i, line in enumerate(lines) if "eval(" in line or "exec(" in line), 1
            ),
            "remediation": "Use ast.literal_eval() for safe expression evaluation.",
            "cve_id": "CWE-95",
        })
    if has_hardcoded_secret:
        security_issues.append({
            "severity": "critical",
            "message": "Hardcoded credential or secret key detected.",
            "line": next(
                (
                    i + 1
                    for i, line in enumerate(lines)
                    if any(k in line.lower() for k in ("password =", "secret =", "api_key =", "token ="))
                ),
                1,
            ),
            "remediation": "Move secrets to environment variables; use a secrets manager.",
            "cve_id": "CWE-798",
        })
    if has_sql_injection:
        security_issues.append({
            "severity": "high",
            "message": "Possible SQL injection via string interpolation.",
            "line": 1,
            "remediation": "Use parameterized queries or an ORM.",
            "cve_id": "CWE-89",
        })
    if has_shell_injection:
        security_issues.append({
            "severity": "high",
            "message": "subprocess called with shell=True — shell injection risk.",
            "line": 1,
            "remediation": "Pass arguments as a list and set shell=False.",
            "cve_id": "CWE-78",
        })

    # ── Real Advanced Analysis ───────────────────────────────
    ast_issues = []
    ast_security_issues = []
    
    if payload.language == "python":
        ast_result = analyze_python_ast(code)
        if ast_result.get("success"):
            ast_issues = ast_result.get("issues", [])
            ast_security_issues = ast_result.get("security_issues", [])
            # Boost scores if AST passes clean
            if not ast_issues:
                style_score += 10
            if not ast_security_issues:
                security_score += 10
            
            # Combine issues
            issues.extend(ast_issues)
            security_issues.extend(ast_security_issues)
            
    # Remove duplicates from simple heuristics if AST caught them
    # For now, we just append.
    
    # ── LLM Integration ──────────────────────────────────────
    llm_result = await generate_ai_review(code, payload.language, payload.context)
    ai_suggestions = llm_result.get("suggestions", [])
    ai_summary = llm_result.get("summary", "")
    ai_metrics = llm_result.get("metrics", {})
    
    suggestions = []
    suggestions.extend(ai_suggestions)
    
    # Adjust scores based on AI metrics if available
    if "maintainability" in ai_metrics:
        quality_score = (quality_score + ai_metrics["maintainability"]) // 2
    if "complexity" in ai_metrics:
        performance_score = max(0, performance_score - (ai_metrics["complexity"] // 5))
        
    overall_score = int((quality_score + security_score + performance_score + style_score) / 4)

    return {
        "overall_score": overall_score,
        "quality_score": quality_score,
        "security_score": security_score,
        "performance_score": performance_score,
        "style_score": style_score,
        "issues": issues,
        "suggestions": suggestions,
        "security_issues": security_issues,
        "metrics": {
            "complexity": ai_metrics.get("complexity", min(100, deeply_nested * 25 + (line_count // 10))),
            "maintainability": quality_score,
            "lines_of_code": line_count,
        },
        "summary": ai_summary or (
            "Code looks clean and well-structured."
            if overall_score >= 85
            else "Code is functional but has room for improvement in style and documentation."
            if overall_score >= 60
            else "Significant issues found — security, quality, and style need improvement."
        ),
    }
