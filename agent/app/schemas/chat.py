from typing import Literal
from uuid import UUID
from pydantic import BaseModel, Field, model_validator


class HistoryMessage(BaseModel):
    role: Literal['USER', 'ASSISTANT']
    content: str = Field(max_length=8000)


class ChatRequest(BaseModel):
    userId: UUID
    conversationId: UUID
    scope: Literal['all', 'workspace', 'documents']
    workspaceId: UUID | None = None
    documentIds: list[UUID] = Field(default_factory=list, max_length=50)
    question: str = Field(min_length=1, max_length=8000)
    generalKnowledge: bool = False
    answerStyle: Literal['SHORT', 'BALANCED', 'DETAILED'] = 'BALANCED'
    explanationLevel: Literal['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] = 'INTERMEDIATE'
    history: list[HistoryMessage] = Field(default_factory=list, max_length=12)

    @model_validator(mode='after')
    def valid_scope(self):
        if self.scope == 'workspace' and not self.workspaceId:
            raise ValueError('Workspace required')
        if self.scope == 'documents' and not self.documentIds:
            raise ValueError('Documents required')
        return self


class GeneratedAnswer(BaseModel):
    answer: str
    sourceIds: list[str]
    insufficientEvidence: bool
