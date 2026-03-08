"""
AstraMentor — Streamlit Community Cloud Demo
Showcases the AI Code Playground, features overview, and live backend connectivity.
Deploy at: https://share.streamlit.io
"""

import streamlit as st  # type: ignore[import]
import requests  # type: ignore[import]
import json
import time

# ── Page config ─────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="AstraMentor — AI Learning Platform",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Constants ────────────────────────────────────────────────────────────────
BACKEND_URL = st.secrets.get("BACKEND_URL", "http://localhost:8000")
SUPPORTED_LANGUAGES = {
    "🐍 Python": "python",
    "🟨 JavaScript": "javascript",
    "🔷 TypeScript": "typescript",
    "☕ Java": "java",
    "⚙️ C++": "cpp",
    "🔩 C": "c",
    "🐹 Go": "go",
    "🦀 Rust": "rust",
    "💎 Ruby": "ruby",
    "🐘 PHP": "php",
}

STARTER_CODE = {
    "python": '''\
# AstraMentor AI Playground 🚀
def greet(name: str) -> str:
    """Return a greeting message."""
    return f"Hello, {name}! Welcome to AstraMentor."

result = greet("Developer")
print(result)
print("Sum 1..100 =", sum(range(1, 101)))
''',
    "javascript": '''\
// AstraMentor AI Playground 🚀
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
const results = Array.from({length: 11}, (_, i) => fibonacci(i));
console.log("Fibonacci:", results.join(", "));
''',
    "java": '''\
// AstraMentor AI Playground 🚀
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from AstraMentor + Java!");
        for (int i = 1; i <= 5; i++) {
            System.out.println("Line " + i);
        }
    }
}
''',
    "cpp": '''\
// AstraMentor AI Playground 🚀
#include <iostream>
#include <vector>

int main() {
    std::vector<int> nums = {1, 2, 3, 4, 5};
    int sum = 0;
    for (int n : nums) sum += n;
    std::cout << "Sum = " << sum << std::endl;
    return 0;
}
''',
    "go": '''\
// AstraMentor AI Playground 🚀
package main
import "fmt"

func main() {
    fmt.Println("Hello from AstraMentor + Go!")
    for i := 1; i <= 5; i++ {
        fmt.Printf("Line %d\\n", i)
    }
}
''',
    "rust": '''\
// AstraMentor AI Playground 🚀
fn main() {
    println!("Hello from AstraMentor + Rust!");
    let nums: Vec<i32> = (1..=5).collect();
    let sum: i32 = nums.iter().sum();
    println!("Sum 1‥5 = {}", sum);
}
''',
    "typescript": "// TypeScript\nconsole.log('Hello from TypeScript!');",
    "ruby": "# Ruby\nputs 'Hello from AstraMentor + Ruby!'\n(1..5).each { |i| puts \"Line #{i}\" }",
    "php": "<?php\necho \"Hello from AstraMentor + PHP!\\n\";\nfor ($i = 1; $i <= 5; $i++) echo \"Line $i\\n\";\n?>",
    "c": "#include <stdio.h>\nint main() { printf(\"Hello from C!\\n\"); return 0; }",
}


# ── Helper: check backend ────────────────────────────────────────────────────
@st.cache_data(ttl=10)
def backend_online():
    try:
        r = requests.get(f"{BACKEND_URL}/", timeout=3)
        return r.status_code < 500
    except Exception:
        return False


def run_code(code: str, language: str, stdin: str = "") -> dict:
    try:
        resp = requests.post(
            f"{BACKEND_URL}/api/v1/playground/execute",
            json={"code": code, "language": language, "input_data": stdin or None},
            timeout=60,
        )
        return resp.json()
    except Exception as e:
        return {"stdout": "", "stderr": str(e), "exit_code": -1, "timed_out": False}


# ── Sidebar ──────────────────────────────────────────────────────────────────
with st.sidebar:
    st.image("https://via.placeholder.com/280x60/6366f1/ffffff?text=🚀+AstraMentor", use_container_width=True)
    st.markdown("---")
    st.markdown("### 🧭 Navigation")
    page = st.radio(
        "Go to",
        ["🏠 Home", "⚡ AI Code Playground", "🏆 Features", "📖 About"],
        label_visibility="collapsed",
    )
    st.markdown("---")
    online = backend_online()
    if online:
        st.success("✅ Backend connected", icon="🟢")
    else:
        st.warning("⚠️ Backend offline\nLocal demo mode active", icon="🟡")
    st.markdown("---")
    st.caption("Built with ❤️ using FastAPI + Next.js + Streamlit")


# ── Pages ────────────────────────────────────────────────────────────────────
if page == "🏠 Home":
    st.title("🚀 AstraMentor")
    st.markdown("### *National-level AI-Powered Adaptive Learning Platform*")
    st.markdown("---")

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Languages Supported", "10", delta="Python, JS, Java, Go…")
    with col2:
        st.metric("AI Features", "6", delta="Chat, Review, Explain…")
    with col3:
        st.metric("Live Collab", "WebSocket", delta="Real-time")

    st.markdown("---")
    st.markdown("## ✨ What is AstraMentor?")
    st.markdown("""
AstraMentor is an intelligent, adaptive learning platform that helps students master programming 
through AI-driven mentorship, live code execution sandboxes, and personalized challenges.

| Feature | Description |
|---|---|
| ⚡ AI Code Playground | Execute code in 10 languages with AI explanations |
| 🤖 Workspace Chat | LLM-powered AI tutor (Claude via AWS Bedrock) |
| 🏆 Smart Challenges | Adaptive coding challenges with XP rewards |
| 🔍 AI Code Reviewer | Security, quality, performance analysis |
| 📚 Repository Intelligence | Upload your repo & ask questions about it |
| 📊 Progress Tracking | XP, levels, streaks, leaderboard |
""")

    st.info("👈 Use the sidebar to navigate to the AI Code Playground and try executing code!", icon="💡")


elif page == "⚡ AI Code Playground":
    st.title("⚡ AI Code Playground")
    st.caption("Execute code in 10 programming languages — powered by AstraMentor's sandbox engine.")
    st.markdown("---")

    col_editor, col_output = st.columns([3, 2])

    with col_editor:
        lang_label = st.selectbox("Language", list(SUPPORTED_LANGUAGES.keys()), index=0)
        language = SUPPORTED_LANGUAGES[lang_label]

        if "current_code" not in st.session_state or st.session_state.get("last_lang") != language:
            st.session_state["current_code"] = STARTER_CODE.get(language, "# Write your code here\n")
            st.session_state["last_lang"] = language

        code = st.text_area(
            "Code Editor",
            value=st.session_state["current_code"],
            height=380,
            key=f"code_{language}",
            label_visibility="collapsed",
            placeholder="Write your code here...",
        )
        st.session_state["current_code"] = code

        stdin_input = st.text_input("stdin (optional)", placeholder="Enter program input here…")

        run_col, reset_col = st.columns([1, 1])
        with run_col:
            run_btn = st.button("▶️ Run Code", type="primary", use_container_width=True)
        with reset_col:
            if st.button("🔄 Reset", use_container_width=True):
                st.session_state["current_code"] = STARTER_CODE.get(language, "")
                st.rerun()

    with col_output:
        st.markdown("### 📤 Output")
        if run_btn:
            if not code.strip():
                st.warning("⚠️ Please write some code first!")
            else:
                with st.spinner(f"⚙️ Running {lang_label}..."):
                    t0 = time.time()
                    result = run_code(code, language, stdin_input)
                    elapsed = time.time() - t0

                exit_code = result.get("exit_code", -1)
                timed_out = result.get("timed_out", False)
                stdout = result.get("stdout", "")
                stderr = result.get("stderr", "")

                if timed_out:
                    st.error("⏱️ Execution timed out (30s limit)")
                elif exit_code == 0:
                    st.success(f"✅ Completed in {elapsed:.2f}s  |  exit code: 0")
                else:
                    st.error(f"❌ Exit code: {exit_code}  |  {elapsed:.2f}s")

                if stdout:
                    st.markdown("**stdout:**")
                    st.code(stdout, language="text")
                if stderr:
                    st.markdown("**stderr:**")
                    st.code(stderr, language="text")
                if not stdout and not stderr:
                    st.info("(no output)")
        else:
            st.info("Hit **▶️ Run Code** to execute your program.")
            st.markdown("**Supported languages:**")
            for label in SUPPORTED_LANGUAGES:
                st.markdown(f"- {label}")


elif page == "🏆 Features":
    st.title("🏆 AstraMentor Features")
    st.markdown("---")

    features = [
        ("⚡ AI Code Playground", "Execute code in Python, JS, TypeScript, Java, C++, C, Go, Rust, Ruby, PHP with AI-powered explanations and inline autocomplete."),
        ("🤖 Workspace AI Chat", "Chat with a Claude-powered AI tutor. Supports Socratic method, debugging mode, builder mode, and code explanations."),
        ("🎯 Smart Challenges", "Adaptive coding challenges that match your skill level, complete with test cases and XP rewards."),
        ("🔍 AI Code Reviewer", "Automated review for quality, security, performance, and style. Gets a score out of 100 with specific suggestions."),
        ("📚 Repository Intelligence", "Upload your GitHub repo or paste a URL and chat with an AI that understands your codebase."),
        ("📊 Progress & Leaderboard", "XP, levels, accuracy streaks, badges, and a real-time leaderboard to compete with peers."),
        ("🤝 Live Collaboration", "Real-time code sharing via WebSockets — edit together like a Google Doc, in the code editor."),
        ("💾 Snippets Library", "Save and organize your favorite code snippets with tags, and revisit them later."),
    ]

    for title, desc in features:
        with st.expander(title, expanded=False):
            st.markdown(desc)


elif page == "📖 About":
    st.title("📖 About AstraMentor")
    st.markdown("---")
    st.markdown("""
## Architecture

```
┌─────────────────────┐    HTTP/WS    ┌──────────────────────┐
│   Next.js Frontend  │ ◄──────────► │  FastAPI Backend     │
│   (Port 3000)       │              │  (Port 8000)         │
└─────────────────────┘              └──────────────────────┘
                                               │
                                    ┌──────────┴──────────┐
                                    │                     │
                            ┌───────▼──────┐   ┌─────────▼──────┐
                            │  AWS Bedrock │   │  Code Sandbox  │
                            │  (Claude AI) │   │  (10 Languages)│
                            └──────────────┘   └────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Monaco Editor |
| Backend | Python 3.11, FastAPI, Pydantic v2, Structlog |
| AI | AWS Bedrock (Claude 3.5 Sonnet) |
| Auth | AWS Cognito |
| Database | PostgreSQL + DynamoDB + Redis |
| Sandbox | subprocess + asyncio.to_thread (Windows compatible) |
| CI/CD | GitHub Actions |

## Repository

🔗 [github.com/Bharathvelan/ASTRO_MENTOR](https://github.com/Bharathvelan/ASTRO_MENTOR)
""")
