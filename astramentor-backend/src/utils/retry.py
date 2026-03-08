from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from sqlalchemy.exc import OperationalError, DBAPIError
import boto3.exceptions


# Database retry decorator
retry_db = retry(
    retry=retry_if_exception_type((OperationalError, DBAPIError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    reraise=True,
)


# AWS service retry decorator
retry_aws = retry(
    retry=retry_if_exception_type((
        boto3.exceptions.Boto3Error,
        Exception,  # Catch boto3 client exceptions
    )),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=20),
    reraise=True,
)


# General retry decorator
retry_general = retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    reraise=True,
)

# Custom backoff for bedrock and other standard APIs
def retry_with_backoff(max_retries: int = 3, base_delay: float = 1.0):
    """
    Retry decorator factory for external APIs.
    """
    return retry(
        stop=stop_after_attempt(max_retries),
        wait=wait_exponential(multiplier=base_delay, min=2, max=60),
        reraise=True,
    )
