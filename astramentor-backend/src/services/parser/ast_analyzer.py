import ast
from typing import Dict, List, Any

class SecurityAnalyzer(ast.NodeVisitor):
    def __init__(self):
        self.issues = []

    def visit_Call(self, node):
        if isinstance(node.func, ast.Name):
            if node.func.id in ('eval', 'exec'):
                self.issues.append({
                    "severity": "critical",
                    "message": f"Use of {node.func.id}() is a critical security vulnerability.",
                    "line": node.lineno,
                    "remediation": "Use ast.literal_eval() for safe expression evaluation.",
                    "cve_id": "CWE-95"
                })
        self.generic_visit(node)
        
    def visit_Assign(self, node):
        # Basic hardcoded secret check
        for target in node.targets:
            if isinstance(target, ast.Name):
                name = target.id.lower()
                if any(secret in name for secret in ['password', 'secret', 'api_key', 'token']):
                    if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
                        self.issues.append({
                            "severity": "critical",
                            "message": f"Hardcoded credential or secret '{target.id}' detected.",
                            "line": node.lineno,
                            "remediation": "Move secrets to environment variables; use a secrets manager.",
                            "cve_id": "CWE-798"
                        })
        self.generic_visit(node)

class ComplexityAnalyzer(ast.NodeVisitor):
    def __init__(self):
        self.functions = {}
        self.current_func = None
        
    def visit_FunctionDef(self, node):
        # Calculate length
        start_line = node.lineno
        end_line = getattr(node, 'end_lineno', start_line)
        length = end_line - start_line
        
        # Calculate naive complexity (branching)
        complexity: int = 1 + sum(
            1
            for child in ast.walk(node)
            if isinstance(child, (ast.If, ast.For, ast.While, ast.Try, ast.With))
        )
                
        self.functions[node.name] = {
            "name": node.name,
            "length": length,
            "complexity": complexity,
            "has_docstring": ast.get_docstring(node) is not None,
            "line": node.lineno
        }
        self.generic_visit(node)

def analyze_python_ast(code: str) -> Dict[str, Any]:
    """Analyzes Python code using AST parsing."""
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return {
            "success": False,
            "error": f"SyntaxError: {str(e)}",
            "line": e.lineno
        }
        
    sec_analyzer = SecurityAnalyzer()
    sec_analyzer.visit(tree)
    
    comp_analyzer = ComplexityAnalyzer()
    comp_analyzer.visit(tree)
    
    issues = []
    suggestions = []
    
    for func_name, stats in comp_analyzer.functions.items():
        if stats["length"] > 30:
            issues.append({
                "id": f"perf-{func_name}-len", "severity": "warning", "category": "performance",
                "message": f"Function '{func_name}' is too long ({stats['length']} lines).",
                "line": stats["line"], "column": 0,
                "suggestion": "Refactor using early returns or extract sub-functions."
            })
        if stats["complexity"] > 10:
             issues.append({
                "id": f"perf-{func_name}-comp", "severity": "warning", "category": "performance",
                "message": f"Function '{func_name}' has high cyclomatic complexity ({stats['complexity']}).",
                "line": stats["line"], "column": 0,
                "suggestion": "Simplify the logic or split into smaller functions."
            })
        if not stats["has_docstring"]:
             issues.append({
                "id": f"style-{func_name}-doc", "severity": "info", "category": "style",
                "message": f"Function '{func_name}' lacks a docstring.",
                "line": stats["line"], "column": 0,
                "suggestion": "Add a docstring to explain the function's purpose."
            })

    return {
        "success": True,
        "security_issues": sec_analyzer.issues,
        "issues": issues,
        "functions": comp_analyzer.functions
    }
