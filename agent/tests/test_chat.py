from uuid import uuid4
from app.schemas.chat import ChatRequest, GeneratedAnswer
from app.services import chat_service


def request(**kwargs):
    return ChatRequest(userId=uuid4(), conversationId=uuid4(), scope='all', question='Explain normalization', **kwargs)


def test_empty_retrieval_never_calls_llm(monkeypatch):
    monkeypatch.setattr(chat_service, 'retrieve', lambda *args: [])
    monkeypatch.setattr(chat_service, 'generate', lambda *args: (_ for _ in ()).throw(AssertionError('LLM should not run')))
    response = chat_service.answer_question(request())
    assert response['insufficientEvidence']
    assert response['sources'] == []


def test_invented_citations_cannot_be_returned(monkeypatch):
    chunk_id = uuid4()
    rows = [{'id': chunk_id, 'document_id': uuid4(), 'content': 'Source text', 'page_number': 12,
             'section': None, 'original_name': 'Lecture.pdf', 'similarity': 0.8}]
    monkeypatch.setattr(chat_service, 'retrieve', lambda *args: rows)
    monkeypatch.setattr(chat_service, 'generate', lambda *args: GeneratedAnswer(answer='An invented claim', sourceIds=['invented-id'], insufficientEvidence=False))
    assert chat_service.answer_question(request())['insufficientEvidence']
    monkeypatch.setattr(chat_service, 'generate', lambda *args: GeneratedAnswer(answer='A grounded answer', sourceIds=[str(chunk_id), 'fake', str(chunk_id)], insufficientEvidence=False))
    result = chat_service.answer_question(request())
    assert len(result['sources']) == 1
    assert result['sources'][0]['pageNumber'] == 12


def test_general_knowledge_is_explicit_and_has_no_document_sources(monkeypatch):
    monkeypatch.setattr(chat_service, 'retrieve', lambda *args: (_ for _ in ()).throw(AssertionError('No retrieval in general mode')))
    monkeypatch.setattr(chat_service, 'generate', lambda *args: GeneratedAnswer(answer='A general answer', sourceIds=['fake'], insufficientEvidence=False))
    result = chat_service.answer_question(request(generalKnowledge=True))
    assert result['answer'] == 'A general answer'
    assert result['sources'] == []
