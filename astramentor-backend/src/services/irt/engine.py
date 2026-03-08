"""IRT (Item Response Theory) engine for adaptive difficulty."""

import logging
import math
from typing import Dict, List, Optional, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class IRTEngine:
    """IRT engine using 2-parameter logistic model."""
    
    def __init__(self, db_session: "Session"):
        """Initialize IRT engine.
        
        Args:
            db_session: Database session for querying user progress
        """
        self.db = db_session
    
    def get_user_skill(self, user_id: str, concept: Optional[str] = None) -> float:
        """Get user skill level estimate (theta).
        
        Args:
            user_id: User ID
            concept: Optional concept to get skill for (None = overall)
            
        Returns:
            Skill level estimate (-3 to +3, where 0 is average)
        """
        # Query user interactions from database
        interactions = self._get_user_interactions(user_id, concept)
        
        if not interactions:
            return 0.0  # Default to average skill
        
        # Estimate theta using maximum likelihood
        theta = self._estimate_theta(interactions)
        
        # Clamp to reasonable bounds
        return max(-3.0, min(3.0, theta))

    
    def _estimate_theta(self, interactions: List[Dict]) -> float:
        """Estimate theta using maximum likelihood estimation.
        
        Uses Newton-Raphson method for 2PL IRT model.
        
        Args:
            interactions: List of user interactions with outcomes
            
        Returns:
            Estimated theta (skill level)
        """
        theta = 0.0  # Initial estimate
        max_iterations = 20
        tolerance = 0.01
        
        for _ in range(max_iterations):
            # Calculate first and second derivatives
            first_deriv = 0.0
            second_deriv = 0.0
            
            for interaction in interactions:
                difficulty = interaction.get("difficulty", 0.0)
                discrimination = interaction.get("discrimination", 1.0)
                correct = interaction.get("correct", False)
                
                # Probability of correct response
                p = self._probability_correct(theta, difficulty, discrimination)
                
                # First derivative (score function)
                if correct:
                    first_deriv += discrimination * (1 - p)
                else:
                    first_deriv -= discrimination * p
                
                # Second derivative (information)
                second_deriv -= discrimination ** 2 * p * (1 - p)
            
            # Newton-Raphson update
            if abs(second_deriv) < 1e-6:
                break
            
            delta = first_deriv / second_deriv
            theta -= delta
            
            # Check convergence
            if abs(delta) < tolerance:
                break
        
        return theta
    
    def _probability_correct(
        self,
        theta: float,
        difficulty: float,
        discrimination: float = 1.0,
    ) -> float:
        """Calculate probability of correct response (2PL model).
        
        P(correct) = 1 / (1 + exp(-discrimination * (theta - difficulty)))
        
        Args:
            theta: Skill level
            difficulty: Item difficulty
            discrimination: Item discrimination
            
        Returns:
            Probability of correct response (0-1)
        """
        exponent = discrimination * (theta - difficulty)
        # Prevent overflow
        exponent = max(-20, min(20, exponent))
        return 1.0 / (1.0 + math.exp(-exponent))

    
    def update_skill(
        self,
        user_id: str,
        concept: str,
        correct: bool,
        difficulty: float,
    ):
        """Update user skill based on interaction outcome.
        
        Args:
            user_id: User ID
            concept: Concept being practiced
            correct: Whether user answered correctly
            difficulty: Difficulty of the item
        """
        # Record interaction in database
        self._record_interaction(user_id, concept, correct, difficulty)
        
        logger.info(
            f"Recorded interaction for user {user_id}: "
            f"concept={concept}, correct={correct}, difficulty={difficulty}"
        )
    
    def recommend_difficulty(self, user_id: str, concept: str) -> float:
        """Recommend difficulty for next question.
        
        Args:
            user_id: User ID
            concept: Concept to practice
            
        Returns:
            Recommended difficulty level
        """
        theta = self.get_user_skill(user_id, concept)
        
        # Recommend items slightly above current skill level
        # This provides optimal learning challenge
        recommended = theta + 0.5
        
        # Clamp to reasonable bounds
        return max(-2.0, min(2.0, recommended))
    
    def _get_user_interactions(
        self,
        user_id: str,
        concept: Optional[str] = None,
    ) -> List[Dict]:
        """Get user interactions from database.
        
        Args:
            user_id: User ID
            concept: Optional concept filter
            
        Returns:
            List of interaction records
        """
        # Query from UserProgress and Interaction tables
        # This is a placeholder - actual implementation depends on Phase 1 models
        try:
            from src.db.models.progress import Interaction
            
            query = self.db.query(Interaction).filter(
                Interaction.user_id == user_id
            )
            
            if concept:
                query = query.filter(Interaction.concept == concept)
            
            interactions = query.order_by(Interaction.timestamp.desc()).limit(100).all()
            
            return [
                {
                    "difficulty": i.difficulty or 0.0,
                    "discrimination": i.discrimination or 1.0,
                    "correct": i.correct,
                    "concept": i.concept,
                    "timestamp": i.timestamp,
                }
                for i in interactions
            ]
        except Exception as e:
            logger.warning(f"Failed to query interactions: {e}")
            return []

    
    def _record_interaction(
        self,
        user_id: str,
        concept: str,
        correct: bool,
        difficulty: float,
    ):
        """Record interaction in database.
        
        Args:
            user_id: User ID
            concept: Concept
            correct: Whether correct
            difficulty: Item difficulty
        """
        try:
            from src.db.models.progress import Interaction
            
            interaction = Interaction(
                user_id=user_id,
                concept=concept,
                correct=correct,
                difficulty=difficulty,
                discrimination=1.0,  # Default discrimination
                timestamp=datetime.utcnow(),
            )
            
            self.db.add(interaction)
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Failed to record interaction: {e}")
            self.db.rollback()
