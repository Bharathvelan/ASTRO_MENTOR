"""Input sanitization utilities to prevent injection attacks."""

import html
import re
from typing import Any

import structlog

logger = structlog.get_logger(__name__)


class InputSanitizer:
    """Sanitizes user input to prevent injection attacks."""

    # SQL injection patterns
    SQL_INJECTION_PATTERNS = [
        r"(\bUNION\b.*\bSELECT\b)",
        r"(\bDROP\b.*\bTABLE\b)",
        r"(\bINSERT\b.*\bINTO\b)",
        r"(\bDELETE\b.*\bFROM\b)",
        r"(\bUPDATE\b.*\bSET\b)",
        r"(--\s*$)",
        r"(;\s*DROP\b)",
        r"(\bOR\b\s+\d+\s*=\s*\d+)",
        r"(\bAND\b\s+\d+\s*=\s*\d+)",
        r"('.*OR.*'.*=.*')",
    ]

    # XSS patterns
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"on\w+\s*=",  # Event handlers like onclick=
        r"<iframe[^>]*>",
        r"<object[^>]*>",
        r"<embed[^>]*>",
    ]

    @staticmethod
    def sanitize_string(value: str, max_length: int = 10000) -> str:
        """
        Sanitize string input.

        Args:
            value: Input string
            max_length: Maximum allowed length

        Returns:
            Sanitized string
        """
        if not isinstance(value, str):
            return str(value)

        # Truncate if too long
        if len(value) > max_length:
            logger.warning("input_truncated", original_length=len(value), max_length=max_length)
            value = value[:max_length]

        # Remove null bytes
        value = value.replace("\x00", "")

        return value

    @staticmethod
    def sanitize_html(value: str) -> str:
        """
        Sanitize HTML to prevent XSS.

        Args:
            value: Input string potentially containing HTML

        Returns:
            HTML-escaped string
        """
        # HTML escape
        value = html.escape(value)

        # Remove script tags and event handlers (case-insensitive)
        for pattern in InputSanitizer.XSS_PATTERNS:
            value = re.sub(pattern, "", value, flags=re.IGNORECASE | re.DOTALL)

        return value

    @staticmethod
    def check_sql_injection(value: str) -> bool:
        """
        Check if string contains SQL injection patterns.

        Args:
            value: Input string

        Returns:
            True if suspicious patterns detected, False otherwise
        """
        for pattern in InputSanitizer.SQL_INJECTION_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                logger.warning("sql_injection_detected", pattern=pattern, value=value[:100])
                return True

        return False

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """
        Sanitize filename to prevent path traversal.

        Args:
            filename: Input filename

        Returns:
            Sanitized filename
        """
        # Remove path separators
        filename = filename.replace("/", "_").replace("\\", "_")

        # Remove parent directory references
        filename = filename.replace("..", "_")

        # Remove null bytes
        filename = filename.replace("\x00", "")

        # Only allow alphanumeric, dash, underscore, and dot
        filename = re.sub(r"[^a-zA-Z0-9._-]", "_", filename)

        # Limit length
        if len(filename) > 255:
            name, ext = filename.rsplit(".", 1) if "." in filename else (filename, "")
            filename = name[:250] + ("." + ext if ext else "")

        return filename

    @staticmethod
    def sanitize_code(code: str, language: str) -> str:
        """
        Sanitize code input (basic validation).

        Args:
            code: Source code
            language: Programming language

        Returns:
            Sanitized code
        """
        # Remove null bytes
        code = code.replace("\x00", "")

        # Limit size
        max_size = 100000  # 100KB
        if len(code) > max_size:
            logger.warning("code_truncated", original_length=len(code), max_length=max_size)
            code = code[:max_size]

        return code

    @staticmethod
    def sanitize_dict(data: dict[str, Any], max_depth: int = 10) -> dict[str, Any]:
        """
        Recursively sanitize dictionary values.

        Args:
            data: Input dictionary
            max_depth: Maximum recursion depth

        Returns:
            Sanitized dictionary
        """
        if max_depth <= 0:
            logger.warning("max_depth_reached")
            return {}

        sanitized = {}
        for key, value in data.items():
            # Sanitize key
            if isinstance(key, str):
                key = InputSanitizer.sanitize_string(key, max_length=100)

            # Sanitize value
            if isinstance(value, str):
                sanitized[key] = InputSanitizer.sanitize_string(value)
            elif isinstance(value, dict):
                sanitized[key] = InputSanitizer.sanitize_dict(value, max_depth - 1)
            elif isinstance(value, list):
                sanitized[key] = [
                    InputSanitizer.sanitize_string(item) if isinstance(item, str) else item
                    for item in value[:1000]  # Limit list size
                ]
            else:
                sanitized[key] = value

        return sanitized


def sanitize_input(value: Any) -> Any:
    """
    Convenience function to sanitize any input.

    Args:
        value: Input value

    Returns:
        Sanitized value
    """
    if isinstance(value, str):
        return InputSanitizer.sanitize_string(value)
    elif isinstance(value, dict):
        return InputSanitizer.sanitize_dict(value)
    else:
        return value
