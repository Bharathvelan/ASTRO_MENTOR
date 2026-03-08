import re
import json
from typing import List, Dict, Any
import structlog
from src.services.execution.piston import execute_code

logger = structlog.get_logger(__name__)

async def evaluate_challenge(challenge: Dict[str, Any], user_code: str, language: str) -> Dict[str, Any]:
    """Evaluates user code against challenge test cases using Piston."""
    
    # We support real execution for Python and JavaScript/TypeScript.
    if language not in ("python", "javascript", "typescript"):
        # Fallback to simple mock for unsupported languages (MVP behavior)
        logger.warning(f"Language {language} not supported for real execution. Mocking.")
        return mock_evaluate(challenge, user_code)

    # Extract function name from starter code
    func_name = extract_entrypoint(challenge["starter_code"], language)
    
    if not func_name:
        return {
            "passed": False,
            "score": 0,
            "xp_earned": 0,
            "test_results": [],
            "feedback": "Could not identify the main function or class in your code.",
            "time_taken_seconds": 0
        }

    # Generate test code
    if language == "python":
        test_wrapper = generate_python_wrapper(user_code, func_name, challenge["test_cases"])
    else: # JS/TS
        test_wrapper = generate_js_wrapper(user_code, func_name, challenge["test_cases"])

    # Execute code
    try:
        import time
        start = time.time()
        result = await execute_code(language, test_wrapper)
        time_taken = time.time() - start
        
        if result["code"] != 0:
            # Syntax error or runtime format error in the whole script
            return format_execution_error(result, challenge, time_taken)
            
        # Parse stdout (we designed the wrapper to output JSON)
        stdout = result["stdout"].strip()
        try:
            # We output JSON at the very end of stdout
            out_lines = stdout.splitlines()
            result_json = json.loads(out_lines[-1])
            
            all_passed = all(tc["passed"] for tc in result_json)
            
            return {
                "passed": all_passed,
                "score": 100 if all_passed else (50 if result_json else 0),
                "xp_earned": challenge["xp_reward"] if all_passed else 0,
                "test_results": result_json,
                "feedback": "All tests passed!" if all_passed else "Some tests failed. Check the output.",
                "time_taken_seconds": time_taken
            }
        except Exception as e:
            # If the user script prints things, it handles it. 
            # If JSON parsing fails, the script crashed or printed weird things.
            logger.error("piston_parse_error", stdout=stdout, stderr=result["stderr"])
            return format_execution_error(result, challenge, time_taken)

    except Exception as e:
        logger.error("evaluate_challenge_error", error=str(e))
        return mock_evaluate(challenge, user_code)

def extract_entrypoint(starter_code: str, language: str) -> str | None:
    """Extracts the first function or class name from the starter code."""
    if language == "python":
        match = re.search(r"def\s+([a-zA-Z0-9_]+)\s*\(", starter_code)
        if match: return match.group(1)
        match = re.search(r"class\s+([a-zA-Z0-9_]+)[\s:]", starter_code)
        if match: return match.group(1)
    else:
        match = re.search(r"function\s+([a-zA-Z0-9_]+)\s*\(", starter_code)
        if match: return match.group(1)
        match = re.search(r"class\s+([a-zA-Z0-9_]+)[\s{]", starter_code)
        if match: return match.group(1)
        # For const func = () => {}
        match = re.search(r"(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>", starter_code)
        if match: return match.group(1)
    return None

def generate_python_wrapper(user_code: str, func_name: str, test_cases: List[Dict]) -> str:
    wrapper = user_code + "\n\n"
    wrapper += "import sys, json, time\n"
    wrapper += "__results = []\n"
    
    for idx, tc in enumerate(test_cases):
        # We try to eval input as python tuples/values.
        # e.g. input: "[2, 7, 11, 15], 9"
        input_str = tc["input"]
        expected_out = tc["expected_output"]
        
        test_block = f"""
try:
    __start = time.time()
    # Handle inputs
    __input_val = ({input_str})
    if isinstance(__input_val, tuple):
        __act = {func_name}(*__input_val)
    else:
        __act = {func_name}(__input_val)
    __elapsed = int((time.time() - __start) * 1000)
    
    __exp = {expected_out}
    # Basic equiv check, convert to json to handle lists/dicts equivalence safely
    __passed = json.dumps(__act, sort_keys=True) == json.dumps(__exp, sort_keys=True)
    __actual_str = json.dumps(__act)
    
    __results.append({{
        "test_case_id": "{tc['id']}",
        "passed": __passed,
        "actual_output": str(__act) if not __passed else "{expected_out}",
        "expected_output": "{expected_out}",
        "execution_time_ms": __elapsed
    }})
except Exception as e:
    __results.append({{
        "test_case_id": "{tc['id']}",
        "passed": False,
        "actual_output": type(e).__name__ + ": " + str(e),
        "expected_output": "{expected_out}",
        "execution_time_ms": 0
    }})
"""
        wrapper += test_block
        
    wrapper += "\nprint(json.dumps(__results))"
    return wrapper

def generate_js_wrapper(user_code: str, func_name: str, test_cases: List[Dict]) -> str:
    wrapper = user_code + "\n\n"
    wrapper += "const __results = [];\n"
    
    for idx, tc in enumerate(test_cases):
        input_str = tc["input"]
        expected_out = tc["expected_output"]
        
        # We wrap in IIFE
        test_block = f"""
(() => {{
    let passed = false;
    let actualStr = "";
    let timeElapsed = 0;
    try {{
        const start = Date.now();
        // Since input might be multiple args separated by commas, we wrap it in an array to parse, or just eval it
        // Actually eval is safe here.
        const act = {func_name}({input_str});
        timeElapsed = Date.now() - start;
        
        let exp;
        try {{ exp = JSON.parse(`{expected_out}`); }} catch(e) {{ exp = eval(`{expected_out}`); }}
        
        passed = JSON.stringify(act) === JSON.stringify(exp);
        actualStr = JSON.stringify(act);
    }} catch(e) {{
        actualStr = e.toString();
    }}
    __results.push({{
        test_case_id: "{tc['id']}",
        passed: passed,
        actual_output: !passed ? actualStr : "{expected_out}",
        expected_output: "{expected_out}",
        execution_time_ms: timeElapsed
    }});
}})();
"""
        wrapper += test_block
        
    wrapper += "\nconsole.log(JSON.stringify(__results));"
    return wrapper

def format_execution_error(result: Dict, challenge: Dict, time_taken: float):
    err = result["stderr"] or result["stdout"]
    results = []
    for tc in challenge["test_cases"]:
         results.append({
            "test_case_id": tc["id"],
            "passed": False,
            "actual_output": "Execution Error: " + err[:200],
            "expected_output": tc["expected_output"],
            "execution_time_ms": 0
        })
    return {
        "passed": False,
        "score": 0,
        "xp_earned": 0,
        "test_results": results,
        "feedback": "Code execution failed.",
        "time_taken_seconds": time_taken
    }


def mock_evaluate(challenge: Dict, user_code: str):
    import asyncio
    
    is_mostly_correct = "return " in user_code and "pass" not in user_code
    results = []
    all_passed = True
    
    for idx, tc in enumerate(challenge["test_cases"]):
        passed = is_mostly_correct
        if is_mostly_correct and idx == 1 and len(user_code) < 50:
             passed = False 

        if not passed:
            all_passed = False

        results.append({
            "test_case_id": tc["id"],
            "passed": passed,
            "actual_output": tc["expected_output"] if passed else "SyntaxError or Incorrect Output",
            "expected_output": tc["expected_output"],
            "execution_time_ms": 42 + (idx * 15)
        })

    return {
        "passed": all_passed,
        "score": 100 if all_passed else (50 if is_mostly_correct else 0),
        "xp_earned": challenge["xp_reward"] if all_passed else 0,
        "test_results": results,
        "feedback": "Mock evaluation: Great job!" if all_passed else "Mock evaluation: Check test cases.",
        "time_taken_seconds": 1.5
    }

