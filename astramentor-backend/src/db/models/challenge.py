from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from src.db.base import Base


class Challenge(Base):
    __tablename__ = "challenges"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(Float, nullable=False)
    concepts = Column(JSON, nullable=False)  # List of concept tags
    starter_code = Column(Text, nullable=True)
    test_cases = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ChallengeAttempt(Base):
    __tablename__ = "challenge_attempts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    challenge_id = Column(UUID(as_uuid=True), ForeignKey("challenges.id"), nullable=False, index=True)
    code = Column(Text, nullable=False)
    passed = Column(Integer, nullable=False)  # 1 for passed, 0 for failed
    tests_passed = Column(Integer, default=0)
    tests_total = Column(Integer, default=0)
    time_spent_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    user = relationship("User", backref="challenge_attempts")
    challenge = relationship("Challenge", backref="attempts")
