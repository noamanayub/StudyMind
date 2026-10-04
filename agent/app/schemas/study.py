from typing import Literal
from uuid import UUID
from pydantic import BaseModel, Field, model_validator


class StudyRequest(BaseModel):
    userId: UUID
    scope: Literal['all', 'workspace', 'documents']
    workspaceId: UUID | None = None
    documentIds: list[UUID] = Field(default_factory=list, max_length=50)
    kind: Literal['SUMMARY', 'NOTES', 'QUIZ', 'FLASHCARDS']
    format: Literal['QUICK', 'DETAILED', 'KEY_POINTS', 'EXAM_REVISION'] = 'QUICK'
    questionType: Literal['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'MIXED'] = 'MULTIPLE_CHOICE'
    difficulty: Literal['EASY', 'MEDIUM', 'HARD'] = 'MEDIUM'
    questionCount: Literal[5, 10, 15, 20] = 5
    cardCount: Literal[5, 10, 20, 30] = 10
    answerStyle: Literal['SHORT', 'BALANCED', 'DETAILED'] = 'BALANCED'
    explanationLevel: Literal['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] = 'INTERMEDIATE'


class GeneratedContent(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    content: str = Field(min_length=1, max_length=50000)
    sourceIds: list[str] = Field(min_length=1, max_length=24)


class GeneratedQuestion(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    type: Literal['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER']
    options: list[str] = Field(default_factory=list, max_length=4)
    correctAnswer: str = Field(min_length=1, max_length=1000)
    acceptedAnswers: list[str] = Field(default_factory=list, max_length=8)
    explanation: str = Field(min_length=1, max_length=3000)
    sourceIds: list[str] = Field(min_length=1, max_length=24)

    @model_validator(mode='after')
    def valid_answer(self):
        if self.type == 'MULTIPLE_CHOICE' and (len(self.options) != 4 or len(set(self.options)) != 4):
            raise ValueError('Four distinct choices required')
        if self.type == 'TRUE_FALSE' and self.options != ['True', 'False']:
            raise ValueError('True/False choices required')
        if self.type != 'SHORT_ANSWER' and self.correctAnswer not in self.options:
            raise ValueError('Correct answer must be an option')
        if self.type == 'SHORT_ANSWER' and self.options:
            raise ValueError('Short answers have no choices')
        return self


class GeneratedQuiz(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    questions: list[GeneratedQuestion] = Field(min_length=5, max_length=20)


class GeneratedCard(BaseModel):
    front: str = Field(min_length=1, max_length=2000)
    back: str = Field(min_length=1, max_length=3000)
    sourceIds: list[str] = Field(min_length=1, max_length=24)


class GeneratedDeck(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    cards: list[GeneratedCard] = Field(min_length=5, max_length=30)
