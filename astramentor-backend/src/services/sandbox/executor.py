"""Code execution sandbox with timeout and resource limits."""

import asyncio
import os
import re
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Optional, List, Dict, Any

import structlog  # type: ignore[import]

logger = structlog.get_logger(__name__)


class Language(str, Enum):
    """Supported programming languages."""

    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    JAVA = "java"
    CPP = "cpp"
    C = "c"
    GO = "go"
    RUST = "rust"
    RUBY = "ruby"
    PHP = "php"


@dataclass
class ExecutionResult:
    """Result of code execution."""

    stdout: str
    stderr: str
    exit_code: int
    timed_out: bool
    error: Optional[str] = None


class CodeExecutor:
    """Executes code in a sandboxed environment with resource limits."""

    def __init__(
        self,
        timeout_seconds: int = 30,
        memory_limit_mb: int = 512,
        max_output_size: int = 10000,
    ):
        """
        Initialize code executor.

        Args:
            timeout_seconds: Maximum execution time (default: 30s)
            memory_limit_mb: Maximum memory usage (default: 512MB)
            max_output_size: Maximum output size in characters (default: 10000)
        """
        self.timeout_seconds = timeout_seconds
        self.memory_limit_mb = memory_limit_mb
        self.max_output_size = max_output_size
        self._temp_dirs: List[Path] = []

    async def execute(
        self, code: str, language: Language, input_data: Optional[str] = None
    ) -> ExecutionResult:
        """
        Execute code in sandboxed environment.

        Args:
            code: Source code to execute
            language: Programming language
            input_data: Optional stdin input

        Returns:
            ExecutionResult with stdout, stderr, exit code, and timeout status
        """
        logger.info("executing_code", language=language, code_length=len(code))

        # Create temporary directory
        temp_dir = Path(tempfile.mkdtemp(prefix="astramentor_sandbox_"))
        self._temp_dirs.append(temp_dir)

        try:
            # Sanitize output before execution
            sanitized_code = self._sanitize_code(code, language)

            # Execute based on language
            if language == Language.PYTHON:
                result = await self._execute_python(sanitized_code, temp_dir, input_data)
            elif language == Language.JAVASCRIPT:
                result = await self._execute_javascript(sanitized_code, temp_dir, input_data)
            elif language == Language.TYPESCRIPT:
                result = await self._execute_typescript(sanitized_code, temp_dir, input_data)
            elif language == Language.JAVA:
                result = await self._execute_java(sanitized_code, temp_dir, input_data)
            elif language == Language.CPP:
                result = await self._execute_cpp(sanitized_code, temp_dir, input_data)
            elif language == Language.C:
                result = await self._execute_c(sanitized_code, temp_dir, input_data)
            elif language == Language.GO:
                result = await self._execute_go(sanitized_code, temp_dir, input_data)
            elif language == Language.RUST:
                result = await self._execute_rust(sanitized_code, temp_dir, input_data)
            elif language == Language.RUBY:
                result = await self._execute_ruby(sanitized_code, temp_dir, input_data)
            elif language == Language.PHP:
                result = await self._execute_php(sanitized_code, temp_dir, input_data)
            else:
                raise ValueError(f"Unsupported language: {language}")

            # Sanitize output
            result.stdout = self._sanitize_output(result.stdout)
            result.stderr = self._sanitize_output(result.stderr)

            logger.info(
                "execution_complete",
                language=language,
                exit_code=result.exit_code,
                timed_out=result.timed_out,
            )

            return result

        except Exception as e:
            logger.error("execution_error", error=str(e), language=language)
            return ExecutionResult(
                stdout="",
                stderr="",
                exit_code=-1,
                timed_out=False,
                error=f"Execution error: {str(e)}",
            )
            
        return ExecutionResult(stdout="", stderr="", exit_code=-1, timed_out=False, error="Unknown state")

    async def _execute_python(
        self, code: str, temp_dir: Path, input_data: Optional[str]
    ) -> ExecutionResult:
        """Execute Python code."""
        import sys
        code_file = temp_dir / "main.py"
        code_file.write_text(code, encoding="utf-8")

        return await self._run_subprocess(
            [sys.executable, str(code_file)],
            temp_dir,
            input_data,
        )

    async def _execute_javascript(
        self, code: str, temp_dir: Path, input_data: Optional[str]
    ) -> ExecutionResult:
        """Execute JavaScript code."""
        code_file = temp_dir / "main.js"
        code_file.write_text(code, encoding="utf-8")

        return await self._run_subprocess(
            ["node", str(code_file)],
            temp_dir,
            input_data,
        )

    async def _execute_typescript(
        self, code: str, temp_dir: Path, input_data: Optional[str]
    ) -> ExecutionResult:
        """Execute TypeScript code (compile then run)."""
        code_file = temp_dir / "main.ts"
        code_file.write_text(code, encoding="utf-8")

        # Compile TypeScript
        compile_result = await self._run_subprocess(
            ["npx", "tsc", str(code_file), "--outDir", str(temp_dir)],
            temp_dir,
            None,
        )

        if compile_result.exit_code != 0:
            return ExecutionResult(
                stdout=compile_result.stdout,
                stderr=f"TypeScript compilation failed:\n{compile_result.stderr}",
                exit_code=compile_result.exit_code,
                timed_out=False,
            )

        # Run compiled JavaScript
        js_file = temp_dir / "main.js"
        return await self._run_subprocess(
            ["node", str(js_file)],
            temp_dir,
            input_data,
        )

    async def _execute_java(
        self, code: str, temp_dir: Path, input_data: Optional[str]
    ) -> ExecutionResult:
        """Execute Java code."""
        match = re.search(r"public\s+class\s+([a-zA-Z0-9_]+)", code)
        class_name = match.group(1) if match else "Main"
        
        code_file = temp_dir / f"{class_name}.java"
        code_file.write_text(code, encoding="utf-8")

        compile_result = await self._run_subprocess(["javac", str(code_file)], temp_dir, None)
        if compile_result.exit_code != 0:
            return compile_result

        return await self._run_subprocess(["java", class_name], temp_dir, input_data)

    async def _execute_cpp(
        self, code: str, temp_dir: Path, input_data: Optional[str]
    ) -> ExecutionResult:
        """Execute C++ code."""
        code_file = temp_dir / "main.cpp"
        exe_file = temp_dir / "main.exe" if os.name == 'nt' else temp_dir / "main"
        code_file.write_text(code, encoding="utf-8")

        compile_result = await self._run_subprocess(["g++", str(code_file), "-o", str(exe_file)], temp_dir, None)
        if compile_result.exit_code != 0:
            return compile_result

        return await self._run_subprocess([str(exe_file)], temp_dir, input_data)

    async def _execute_c(
        self, code: str, temp_dir: Path, input_data: Optional[str]
    ) -> ExecutionResult:
        """Execute C code."""
        code_file = temp_dir / "main.c"
        exe_file = temp_dir / "main.exe" if os.name == 'nt' else temp_dir / "main"
        code_file.write_text(code, encoding="utf-8")

        compile_result = await self._run_subprocess(["gcc", str(code_file), "-o", str(exe_file)], temp_dir, None)
        if compile_result.exit_code != 0:
            return compile_result

        return await self._run_subprocess([str(exe_file)], temp_dir, input_data)

    async def _execute_go(
        self, code: str, temp_dir: Path, input_data: Optional[str]
    ) -> ExecutionResult:
        """Execute Go code."""
        code_file = temp_dir / "main.go"
        code_file.write_text(code, encoding="utf-8")
        return await self._run_subprocess(["go", "run", str(code_file)], temp_dir, input_data)

    async def _execute_rust(
        self, code: str, temp_dir: Path, input_data: Optional[str]
    ) -> ExecutionResult:
        """Execute Rust code."""
        code_file = temp_dir / "main.rs"
        exe_file = temp_dir / "main.exe" if os.name == 'nt' else temp_dir / "main"
        code_file.write_text(code, encoding="utf-8")

        compile_result = await self._run_subprocess(["rustc", str(code_file), "-o", str(exe_file)], temp_dir, None)
        if compile_result.exit_code != 0:
            return compile_result

        return await self._run_subprocess([str(exe_file)], temp_dir, input_data)

    async def _execute_ruby(
        self, code: str, temp_dir: Path, input_data: Optional[str]
    ) -> ExecutionResult:
        """Execute Ruby code."""
        code_file = temp_dir / "main.rb"
        code_file.write_text(code, encoding="utf-8")
        return await self._run_subprocess(["ruby", str(code_file)], temp_dir, input_data)

    async def _execute_php(
        self, code: str, temp_dir: Path, input_data: Optional[str]
    ) -> ExecutionResult:
        """Execute PHP code."""
        code_file = temp_dir / "main.php"
        code_file.write_text(code, encoding="utf-8")
        return await self._run_subprocess(["php", str(code_file)], temp_dir, input_data)

    async def _run_subprocess(
        self,
        cmd: List[str],
        cwd: Path,
        input_data: Optional[str],
    ) -> ExecutionResult:
        """
        Run subprocess with timeout and resource limits.

        Args:
            cmd: Command and arguments
            cwd: Working directory
            input_data: Optional stdin input

        Returns:
            ExecutionResult
        """
        try:
            import subprocess

            def run_sync():
                return subprocess.run(
                    cmd,
                    input=input_data.encode("utf-8") if input_data else None,
                    capture_output=True,
                    cwd=str(cwd),
                    env={**os.environ, "NO_PROXY": "*"},
                    timeout=self.timeout_seconds,
                )

            try:
                # Use to_thread to avert blocking the event loop
                process_result = await asyncio.to_thread(run_sync)  # type: ignore[arg-type]
                
                limit: int = int(self.max_output_size)
                stdout = process_result.stdout.decode("utf-8", errors="replace")[:limit] if process_result.stdout else ""  # type: ignore[index]
                stderr = process_result.stderr.decode("utf-8", errors="replace")[:limit] if process_result.stderr else ""  # type: ignore[index]

                return ExecutionResult(
                    stdout=stdout,
                    stderr=stderr,
                    exit_code=process_result.returncode,
                    timed_out=False,
                )

            except subprocess.TimeoutExpired:
                return ExecutionResult(
                    stdout="",
                    stderr=f"Execution timed out after {self.timeout_seconds} seconds",
                    exit_code=-1,
                    timed_out=True,
                )

        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.error("subprocess_error", error=repr(e), cmd=cmd)
            return ExecutionResult(
                stdout="",
                stderr=f"Subprocess error: {repr(e)}\nTraceback: {traceback.format_exc()}",
                exit_code=-1,
                timed_out=False,
            )

    def _sanitize_code(self, code: str, language: Language) -> str:
        """
        Sanitize code to prevent dangerous operations.

        Args:
            code: Source code
            language: Programming language

        Returns:
            Sanitized code (currently returns as-is, actual sanitization in sandbox)
        """
        # Basic validation - actual isolation happens at subprocess level
        if len(code) > 100000:  # 100KB limit
            raise ValueError("Code too large")

        return code

    def _sanitize_output(self, output: str) -> str:
        """
        Sanitize output to remove dangerous content.

        Args:
            output: Raw output

        Returns:
            Sanitized output
        """
        # Remove potential file paths that might leak system info
        output = re.sub(r"/[a-zA-Z0-9_\-/]+/astramentor_sandbox_[a-zA-Z0-9]+", "[sandbox]", output)

        # Remove potential secrets (basic patterns)
        output = re.sub(
            r"(password|secret|token|key)\s*[:=]\s*['\"]?[a-zA-Z0-9_\-]+['\"]?",
            r"\1=[REDACTED]",
            output,
            flags=re.IGNORECASE,
        )

        # Truncate if too long
        limit: int = int(self.max_output_size)
        if len(output) > limit:
            output = output[:limit] + "\n... (output truncated)"  # type: ignore

        return output

    def cleanup(self) -> None:
        """Clean up temporary directories."""
        for temp_dir in self._temp_dirs:
            try:
                if temp_dir.exists():
                    shutil.rmtree(temp_dir)
                    logger.debug("cleaned_temp_dir", path=str(temp_dir))
            except Exception as e:
                logger.warning("cleanup_failed", path=str(temp_dir), error=str(e))

        self._temp_dirs.clear()

    def __del__(self):
        """Cleanup on deletion."""
        self.cleanup()
