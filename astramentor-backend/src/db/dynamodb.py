import boto3
from datetime import datetime
from typing import Optional, List, Dict, Any
from src.core.config import settings


class DynamoDBClient:
    """Client for DynamoDB operations"""
    
    def __init__(self):
        self.client = boto3.client('dynamodb', region_name=settings.AWS_REGION)
        self.resource = boto3.resource('dynamodb', region_name=settings.AWS_REGION)
        self.chat_table = self.resource.Table(settings.DYNAMODB_CHAT_TABLE)
        self.interactions_table = self.resource.Table(settings.DYNAMODB_INTERACTIONS_TABLE)
    
    async def store_chat_message(
        self,
        session_id: str,
        user_id: str,
        role: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Store a chat message"""
        timestamp = datetime.utcnow().isoformat()
        
        item = {
            'session_id': session_id,
            'timestamp': timestamp,
            'user_id': user_id,
            'role': role,
            'content': content,
        }
        
        if metadata:
            item['metadata'] = metadata
        
        self.chat_table.put_item(Item=item)
    
    async def get_chat_history(
        self,
        session_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Retrieve chat history for a session"""
        response = self.chat_table.query(
            KeyConditionExpression='session_id = :sid',
            ExpressionAttributeValues={':sid': session_id},
            Limit=limit,
            ScanIndexForward=True  # Oldest first
        )
        
        return response.get('Items', [])
    
    async def store_agent_interaction(
        self,
        user_id: str,
        agent_type: str,
        query: str,
        response: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Store an agent interaction"""
        timestamp = datetime.utcnow().isoformat()
        
        item = {
            'user_id': user_id,
            'timestamp': timestamp,
            'agent_type': agent_type,
            'query': query,
            'response': response,
        }
        
        if metadata:
            item['metadata'] = metadata
        
        self.interactions_table.put_item(Item=item)
    
    async def get_user_interactions(
        self,
        user_id: str,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Retrieve user's agent interactions"""
        response = self.interactions_table.query(
            KeyConditionExpression='user_id = :uid',
            ExpressionAttributeValues={':uid': user_id},
            Limit=limit,
            ScanIndexForward=False  # Newest first
        )
        
        return response.get('Items', [])


# Global instance
dynamodb_client = DynamoDBClient()
