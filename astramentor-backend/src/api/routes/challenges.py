"""Code challenges API endpoints."""

from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import structlog
import os

from src.api.middleware.auth import get_current_user
from src.services.execution.runner import evaluate_challenge

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1/challenges", tags=["challenges"])

class HintRequest(BaseModel):
    code: str
    language: str

class HintResponse(BaseModel):
    hint: str

# --- Challenge Data ---
MOCK_CHALLENGES = [
    {
        "id": "chal_1",
        "title": "Two Sum",
        "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume each input has exactly one solution.",
        "difficulty": "beginner",
        "language": "python",
        "topic": "Arrays & Hashing",
        "starter_code": "def two_sum(nums: list[int], target: int) -> list[int]:\n    # Write your code here\n    pass",
        "hints": [
            "A brute force approach uses two nested loops — O(n²).",
            "Can you use a hash map to store elements you've seen so far?",
            "For each number x, check if (target - x) already exists in your map."
        ],
        "test_cases": [
            {"id": "tc1", "input": "[2, 7, 11, 15], 9", "expected_output": "[0, 1]", "is_hidden": False, "description": "Basic example"},
            {"id": "tc2", "input": "[3, 2, 4], 6", "expected_output": "[1, 2]", "is_hidden": False, "description": "Unordered array"},
            {"id": "tc3", "input": "[3, 3], 6", "expected_output": "[0, 1]", "is_hidden": True, "description": "Duplicates"},
        ],
        "xp_reward": 50,
        "time_limit_minutes": 15,
    },
    {
        "id": "chal_2",
        "title": "Valid Parentheses",
        "description": "Given a string containing only '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input is valid if brackets close in the correct order.",
        "difficulty": "beginner",
        "language": "python",
        "topic": "Stacks",
        "starter_code": "def is_valid(s: str) -> bool:\n    # Write your code here\n    pass",
        "hints": [
            "Use a stack to keep track of opening brackets.",
            "When you see a closing bracket, the top of the stack must match.",
            "At the end, the stack should be empty for a valid string."
        ],
        "test_cases": [
            {"id": "tc1", "input": "\"()[]{}\"", "expected_output": "true", "is_hidden": False, "description": "All types"},
            {"id": "tc2", "input": "\"(]\"", "expected_output": "false", "is_hidden": False, "description": "Invalid matching"},
        ],
        "xp_reward": 50,
        "time_limit_minutes": 15,
    },
    {
        "id": "chal_3",
        "title": "Fibonacci with Memoization",
        "description": "Implement an efficient Fibonacci function using memoization. The naive recursive approach is O(2^n) — bring it down to O(n) using a cache.",
        "difficulty": "beginner",
        "language": "python",
        "topic": "Dynamic Programming",
        "starter_code": "def fib(n: int, memo: dict | None = None) -> int:\n    if memo is None:\n        memo = {}\n    # Write your code here\n    pass",
        "hints": [
            "Store previously computed values in the memo dict.",
            "Check if n is already in memo before computing it.",
            "Base cases: fib(0) = 0, fib(1) = 1."
        ],
        "test_cases": [
            {"id": "tc1", "input": "10", "expected_output": "55", "is_hidden": False, "description": "fib(10)"},
            {"id": "tc2", "input": "30", "expected_output": "832040", "is_hidden": False, "description": "fib(30)"},
        ],
        "xp_reward": 50,
        "time_limit_minutes": 20,
    },
    {
        "id": "chal_4",
        "title": "Binary Search",
        "description": "Given a sorted array of distinct integers and a target value, return the index of the target if found, or -1 if not present. Your solution must run in O(log n).",
        "difficulty": "beginner",
        "language": "python",
        "topic": "Binary Search",
        "starter_code": "def search(nums: list[int], target: int) -> int:\n    # Write your code here\n    pass",
        "hints": [
            "Maintain left and right pointers.",
            "Calculate mid = (left + right) // 2 each iteration.",
            "If nums[mid] == target, return mid. Adjust pointers otherwise."
        ],
        "test_cases": [
            {"id": "tc1", "input": "[-1, 0, 3, 5, 9, 12], 9", "expected_output": "4", "is_hidden": False, "description": "Target found"},
            {"id": "tc2", "input": "[-1, 0, 3, 5, 9, 12], 2", "expected_output": "-1", "is_hidden": False, "description": "Target not found"},
        ],
        "xp_reward": 50,
        "time_limit_minutes": 20,
    },
    {
        "id": "chal_5",
        "title": "LRU Cache",
        "description": "Design a data structure for a Least Recently Used (LRU) cache. Implement LRUCache with get(key) and put(key, value), both in O(1) average time. Evict the least-recently-used item when capacity is exceeded.",
        "difficulty": "intermediate",
        "language": "python",
        "topic": "Data Structures",
        "starter_code": "from collections import OrderedDict\n\nclass LRUCache:\n    def __init__(self, capacity: int):\n        self.cap = capacity\n        self.cache: OrderedDict = OrderedDict()\n\n    def get(self, key: int) -> int:\n        # Return -1 if key not found\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        # Insert or update the key\n        pass",
        "hints": [
            "OrderedDict remembers insertion order and supports move_to_end().",
            "On get, move the accessed key to the end (most recent).",
            "On put, if at capacity, pop the first (least recent) item."
        ],
        "test_cases": [
            {"id": "tc1", "input": "capacity=2, ops=[put(1,1), put(2,2), get(1), put(3,3), get(2)]", "expected_output": "[null,null,1,null,-1]", "is_hidden": False, "description": "Basic LRU"},
        ],
        "xp_reward": 100,
        "time_limit_minutes": 40,
    },
    {
        "id": "chal_6",
        "title": "Binary Search Tree Validation",
        "description": "Given the root of a binary tree, determine if it is a valid BST. Every node in the left subtree must be strictly less than the node's value, and every node in the right subtree must be strictly greater.",
        "difficulty": "intermediate",
        "language": "python",
        "topic": "Trees & Graphs",
        "starter_code": "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef is_valid_bst(root: TreeNode, min_val=float('-inf'), max_val=float('inf')) -> bool:\n    # Write your code here\n    pass",
        "hints": [
            "Pass down min and max bounds as you recurse.",
            "For the left subtree, max_val = current node's value.",
            "For the right subtree, min_val = current node's value."
        ],
        "test_cases": [
            {"id": "tc1", "input": "[2,1,3]", "expected_output": "True", "is_hidden": False, "description": "Valid BST"},
            {"id": "tc2", "input": "[5,1,4,null,null,3,6]", "expected_output": "False", "is_hidden": False, "description": "Invalid BST"},
        ],
        "xp_reward": 100,
        "time_limit_minutes": 40,
    },
    {
        "id": "chal_7",
        "title": "Number of Islands",
        "description": "Given an m×n grid of '1's (land) and '0's (water), count the number of islands. An island is formed by connecting adjacent lands horizontally or vertically.",
        "difficulty": "intermediate",
        "language": "python",
        "topic": "Graphs & BFS/DFS",
        "starter_code": "def num_islands(grid: list[list[str]]) -> int:\n    # Write your code here\n    pass",
        "hints": [
            "Use DFS or BFS to explore each island.",
            "Mark visited cells as '0' to avoid revisiting.",
            "Count how many times you start a new DFS/BFS from an unvisited '1'."
        ],
        "test_cases": [
            {"id": "tc1", "input": "[[\"1\",\"1\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"1\",\"1\"]]", "expected_output": "1", "is_hidden": False, "description": "Connected land"},
            {"id": "tc2", "input": "[[\"1\",\"0\",\"1\"],[\"0\",\"0\",\"0\"],[\"1\",\"0\",\"1\"]]", "expected_output": "4", "is_hidden": False, "description": "Separate islands"},
        ],
        "xp_reward": 100,
        "time_limit_minutes": 35,
    },
    {
        "id": "chal_8",
        "title": "Merge Intervals",
        "description": "Given an array of intervals [start, end], merge all overlapping intervals and return a sorted, non-overlapping list that covers all intervals in the input.",
        "difficulty": "intermediate",
        "language": "python",
        "topic": "Sorting & Intervals",
        "starter_code": "def merge(intervals: list[list[int]]) -> list[list[int]]:\n    # Write your code here\n    pass",
        "hints": [
            "Sort intervals by their start time.",
            "Iterate through sorted intervals and merge when current start <= previous end.",
            "The merged interval's end is max(prev_end, curr_end)."
        ],
        "test_cases": [
            {"id": "tc1", "input": "[[1,3],[2,6],[8,10],[15,18]]", "expected_output": "[[1,6],[8,10],[15,18]]", "is_hidden": False, "description": "Overlapping pairs"},
            {"id": "tc2", "input": "[[1,4],[4,5]]", "expected_output": "[[1,5]]", "is_hidden": False, "description": "Touching intervals"},
        ],
        "xp_reward": 100,
        "time_limit_minutes": 30,
    },
    {
        "id": "chal_9",
        "title": "Word Frequency Counter",
        "description": "Given a paragraph of text, return the top K most frequent words as a list sorted by frequency (descending). In case of a tie, sort alphabetically. Ignore case and punctuation.",
        "difficulty": "beginner",
        "language": "python",
        "topic": "Hash Maps & Strings",
        "starter_code": "import re\nfrom collections import Counter\n\ndef top_k_words(text: str, k: int) -> list[str]:\n    # Write your code here\n    pass",
        "hints": [
            "Use re.findall(r'[a-z]+', text.lower()) to extract words.",
            "Counter gives you word frequencies in one line.",
            "Sort by (-frequency, word) to handle ties alphabetically."
        ],
        "test_cases": [
            {"id": "tc1", "input": "\"the quick brown fox jumps over the lazy dog the\", k=3", "expected_output": "[\"the\", \"brown\", \"dog\"]", "is_hidden": False, "description": "Top 3 words"},
        ],
        "xp_reward": 50,
        "time_limit_minutes": 20,
    },
    {
        "id": "chal_10",
        "title": "Async Rate Limiter",
        "description": "Implement an async rate limiter in TypeScript that allows at most N requests per second. Excess requests should be queued and processed when slots become available, preserving order.",
        "difficulty": "advanced",
        "language": "typescript",
        "topic": "Concurrency & Async",
        "starter_code": "class RateLimiter {\n  private tokens: number;\n  private queue: Array<() => void> = [];\n  private interval: ReturnType<typeof setInterval> | null = null;\n\n  constructor(private maxPerSecond: number) {\n    this.tokens = maxPerSecond;\n  }\n\n  async execute<T>(fn: () => Promise<T>): Promise<T> {\n    // Your code here\n    throw new Error('Not implemented');\n  }\n}",
        "hints": [
            "Use a token bucket: replenish tokens every second with setInterval.",
            "If tokens > 0, execute immediately and decrement tokens.",
            "Otherwise, wrap the call in a Promise and push the resolver to the queue."
        ],
        "test_cases": [
            {"id": "tc1", "input": "maxPerSecond=2, 5 concurrent requests", "expected_output": "All 5 complete, last 3 delayed by >=1s", "is_hidden": False, "description": "Rate limiting"},
        ],
        "xp_reward": 200,
        "time_limit_minutes": 60,
    },
    {
        "id": "chal_11",
        "title": "Distributed Counter",
        "description": "Implement a thread-safe distributed counter class that handles concurrent increments correctly. Use atomic operations or locks to prevent race conditions when 100+ threads increment simultaneously.",
        "difficulty": "advanced",
        "language": "python",
        "topic": "Distributed Systems",
        "starter_code": "import threading\n\nclass DistributedCounter:\n    def __init__(self):\n        # Initialize your counter and lock\n        pass\n\n    def increment(self) -> int:\n        \"\"\"Atomically increment and return the new value.\"\"\"\n        pass\n\n    def get(self) -> int:\n        \"\"\"Return the current value.\"\"\"\n        pass",
        "hints": [
            "Use threading.Lock() to create a mutex.",
            "Acquire the lock before reading/writing the counter.",
            "Return the new value inside the locked section."
        ],
        "test_cases": [
            {"id": "tc1", "input": "100 threads, each incrementing 10 times", "expected_output": "1000", "is_hidden": False, "description": "Thread-safe counter"},
        ],
        "xp_reward": 200,
        "time_limit_minutes": 60,
    },
    {
        "id": "chal_12",
        "title": "Promise.all Polyfill",
        "description": "Implement a polyfill for Promise.all in JavaScript. It takes an array of Promises and returns a Promise that resolves with an array of results when all promises have resolved, or rejects immediately if any promise rejects.",
        "difficulty": "advanced",
        "language": "javascript",
        "topic": "JavaScript Internals",
        "starter_code": "/**\n * @param {Promise[]} promises\n * @returns {Promise<any[]>}\n */\nfunction promiseAll(promises) {\n  // Write your code here\n}\n\nmodule.exports = promiseAll;",
        "hints": [
            "Create a new Promise wrapper.",
            "Track the count of resolved promises and their results.",
            "Reject as soon as any promise rejects."
        ],
        "test_cases": [
            {"id": "tc1", "input": "[Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]", "expected_output": "[1, 2, 3]", "is_hidden": False, "description": "All resolve"},
            {"id": "tc2", "input": "[Promise.resolve(1), Promise.reject('err')]", "expected_output": "Rejected with 'err'", "is_hidden": False, "description": "One rejects"},
        ],
        "xp_reward": 200,
        "time_limit_minutes": 45,
    },
]


class ChallengeSubmission(BaseModel):
    challenge_id: str
    code: str
    language: str


@router.get("", response_model=List[Dict[str, Any]])
async def list_challenges(
    difficulty: str | None = None,
    language: str | None = None,
    current_user: dict = Depends(get_current_user),
):
    """List available coding challenges."""
    logger.info("list_challenges_requested", filters={"difficulty": difficulty, "language": language})
    
    results = MOCK_CHALLENGES
    if difficulty:
        results = [c for c in results if c["difficulty"] == difficulty]
    if language:
        results = [c for c in results if c["language"] == language]
        
    return results


@router.get("/{challenge_id}", response_model=Dict[str, Any])
async def get_challenge(
    challenge_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get details for a specific challenge."""
    challenge = next((c for c in MOCK_CHALLENGES if c["id"] == challenge_id), None)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge


@router.post("/submit", response_model=Dict[str, Any])
async def submit_challenge(
    submission: ChallengeSubmission,
    current_user: dict = Depends(get_current_user),
):
    """
    Submit code for a challenge and evaluate test cases.
    Uses real code execution via Piston API.
    """
    _user_id = current_user.get("user_id", "unknown")
    
    challenge = next((c for c in MOCK_CHALLENGES if c["id"] == submission.challenge_id), None)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    return await evaluate_challenge(challenge, submission.code, submission.language)


@router.get("/{challenge_id}/hints/{hint_index}", response_model=Dict[str, str])
async def get_challenge_hint(
    challenge_id: str,
    hint_index: int,
    current_user: dict = Depends(get_current_user),
):
    """Retrieve a specific hint for a challenge."""
    challenge = next((c for c in MOCK_CHALLENGES if c["id"] == challenge_id), None)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    hints = challenge.get("hints", [])
    if hint_index < 0 or hint_index >= len(hints):
        raise HTTPException(status_code=400, detail="Invalid hint index")

    return {"hint": hints[hint_index]}


@router.post("/{challenge_id}/smart-hint", response_model=HintResponse)
async def get_smart_hint(
    challenge_id: str,
    request: HintRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get an AI-generated Socratic hint based on current code progress."""
    challenge = next((c for c in MOCK_CHALLENGES if c["id"] == challenge_id), None)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
    
    if api_key:
        try:
             from langchain_core.messages import HumanMessage, SystemMessage
             from langchain_openai import ChatOpenAI
             
             llm = ChatOpenAI(temperature=0.3, model="gpt-4o-mini", max_tokens=150)
             
             prompt = f"The user is trying to solve the following challenge:\nTitle: {challenge['title']}\nDescription: {challenge['description']}\n\nTheir current code is:\n```{request.language}\n{request.code}\n```\n\nProvide a short, socratic hint to help them progress. Do not give away the full answer."
             
             messages = [
                 SystemMessage(content="You are an expert, Socratic programming tutor. You guide students to answers through hints and questions, never providing direct code solutions."),
                 HumanMessage(content=prompt)
             ]
             
             response = await llm.ainvoke(messages)
             return HintResponse(hint=str(response.content))
        except Exception as e:
            logger.error("hint_generation_error", error=str(e))
    
    # Fallback to a static hint if API fails or is missing
    hints = challenge["hints"]
    import random
    return HintResponse(hint=random.choice(hints))


@router.get("/leaderboard/global", response_model=List[Dict[str, Any]])
async def get_leaderboard(
    current_user: dict = Depends(get_current_user)
):
    """Get global leaderboard for challenges."""
    user_name = current_user.get("user_id", "You").split("-")[0]
    return [
         {"rank": 1, "username": "CodeNinja", "score": 1250},
         {"rank": 2, "username": "AlgorithmMaster", "score": 1100},
         {"rank": 3, "username": "DeveloperX", "score": 950},
         {"rank": 4, "username": user_name, "score": 850},
         {"rank": 5, "username": "BinaryBot", "score": 720},
    ]
