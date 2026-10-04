from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import authenticate
from app.schemas.chat import ChatRequest
from app.services.chat_service import answer_question
from app.llm.client import ProviderUnavailable
from app.core.database import connection

router = APIRouter(dependencies=[Depends(authenticate)])


@router.post('/chat')
def chat(request: ChatRequest):
    with connection() as conn:
        record = conn.execute('SELECT id FROM conversations WHERE id=%s AND user_id=%s',
                              [request.conversationId, request.userId]).fetchone()
    if not record:
        raise HTTPException(404, 'Conversation not found.')
    try:
        return answer_question(request)
    except ProviderUnavailable as error:
        raise HTTPException(503, str(error)) from error
