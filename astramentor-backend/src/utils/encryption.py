"""Data encryption utilities for sensitive data.

Note: This module provides application-level encryption utilities.
Infrastructure-level encryption (RDS, S3, DynamoDB) is configured in CDK.
"""

import base64
import os
from typing import Optional

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2

import structlog

logger = structlog.get_logger(__name__)


class EncryptionManager:
    """Manages encryption and decryption of sensitive data."""

    def __init__(self, encryption_key: Optional[str] = None):
        """
        Initialize encryption manager.

        Args:
            encryption_key: Base64-encoded encryption key (32 bytes).
                           If not provided, uses ENCRYPTION_KEY env var.
                           If env var not set, generates a new key (not recommended for production).
        """
        if encryption_key:
            self.key = encryption_key.encode()
        else:
            key_str = os.environ.get("ENCRYPTION_KEY")
            if key_str:
                self.key = key_str.encode()
            else:
                # Generate new key (WARNING: not persistent across restarts)
                logger.warning(
                    "no_encryption_key_provided",
                    message="Generating ephemeral encryption key. Set ENCRYPTION_KEY env var for production.",
                )
                self.key = Fernet.generate_key()

        self.fernet = Fernet(self.key)

    @staticmethod
    def generate_key() -> str:
        """
        Generate a new encryption key.

        Returns:
            Base64-encoded encryption key
        """
        key = Fernet.generate_key()
        return key.decode()

    @staticmethod
    def derive_key_from_password(password: str, salt: Optional[bytes] = None) -> tuple[str, str]:
        """
        Derive encryption key from password using PBKDF2.

        Args:
            password: Password to derive key from
            salt: Optional salt (16 bytes). If not provided, generates random salt.

        Returns:
            Tuple of (base64_key, base64_salt)
        """
        if salt is None:
            salt = os.urandom(16)

        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))

        return key.decode(), base64.b64encode(salt).decode()

    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt plaintext string.

        Args:
            plaintext: String to encrypt

        Returns:
            Base64-encoded encrypted string
        """
        try:
            encrypted_bytes = self.fernet.encrypt(plaintext.encode())
            return encrypted_bytes.decode()
        except Exception as e:
            logger.error("encryption_error", error=str(e))
            raise

    def decrypt(self, ciphertext: str) -> str:
        """
        Decrypt ciphertext string.

        Args:
            ciphertext: Base64-encoded encrypted string

        Returns:
            Decrypted plaintext string
        """
        try:
            decrypted_bytes = self.fernet.decrypt(ciphertext.encode())
            return decrypted_bytes.decode()
        except Exception as e:
            logger.error("decryption_error", error=str(e))
            raise

    def encrypt_dict(self, data: dict, fields: list[str]) -> dict:
        """
        Encrypt specific fields in a dictionary.

        Args:
            data: Dictionary with data
            fields: List of field names to encrypt

        Returns:
            Dictionary with encrypted fields
        """
        encrypted_data = data.copy()

        for field in fields:
            if field in encrypted_data and encrypted_data[field]:
                try:
                    encrypted_data[field] = self.encrypt(str(encrypted_data[field]))
                except Exception as e:
                    logger.error("field_encryption_error", field=field, error=str(e))

        return encrypted_data

    def decrypt_dict(self, data: dict, fields: list[str]) -> dict:
        """
        Decrypt specific fields in a dictionary.

        Args:
            data: Dictionary with encrypted data
            fields: List of field names to decrypt

        Returns:
            Dictionary with decrypted fields
        """
        decrypted_data = data.copy()

        for field in fields:
            if field in decrypted_data and decrypted_data[field]:
                try:
                    decrypted_data[field] = self.decrypt(decrypted_data[field])
                except Exception as e:
                    logger.error("field_decryption_error", field=field, error=str(e))

        return decrypted_data


# Infrastructure-level encryption configuration notes:
#
# RDS PostgreSQL:
# - Enable encryption at rest using AWS KMS
# - Configure in CDK: storage_encrypted=True, kms_key=kms_key
# - Enforce TLS connections: rds.force_ssl=1 in parameter group
#
# S3:
# - Enable default encryption using AWS KMS
# - Configure in CDK: encryption=s3.BucketEncryption.KMS, encryption_key=kms_key
# - Enforce TLS: bucket policy with aws:SecureTransport condition
#
# DynamoDB:
# - Enable encryption at rest using AWS managed keys
# - Configure in CDK: encryption=dynamodb.TableEncryption.AWS_MANAGED
# - All connections use TLS by default
#
# ElastiCache Redis:
# - Enable encryption at rest
# - Configure in CDK: at_rest_encryption_enabled=True
# - Enable encryption in transit: transit_encryption_enabled=True
#
# Application connections:
# - PostgreSQL: Use sslmode=require in connection string
# - Redis: Use TLS endpoint (rediss://)
# - S3: boto3 uses HTTPS by default
# - DynamoDB: boto3 uses HTTPS by default
