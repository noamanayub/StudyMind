import json
from types import SimpleNamespace
import pytest
from app.llm import client as provider
from app.schemas.study import GeneratedQuiz
from app.documents.media import Transcript


def test_wire_schema_resolves_nested_definitions_but_local_validation_stays_strict():
    schema = provider.wire_schema(GeneratedQuiz)
    assert schema['properties']['questions']['items']['properties']['type']['enum'] == ['MULTIPLE_CHOICE','TRUE_FALSE','SHORT_ANSWER']
    assert '$ref' not in json.dumps(schema)
    assert '$defs' not in schema
    assert 'maxItems' not in json.dumps(schema)
    with pytest.raises(ValueError):
        GeneratedQuiz.model_validate({'title':'Invalid','questions':[]})


def test_generate_uses_simple_wire_schema_and_validates_provider_json(monkeypatch):
    seen = []
    def response(**kwargs):
        seen.append(kwargs['config'])
        return SimpleNamespace(text=json.dumps({'segments':[{'startSeconds':0,'endSeconds':1,'text':'Speech.'}]}))
    monkeypatch.setattr(provider,'client',lambda:SimpleNamespace(models=SimpleNamespace(generate_content=response)))
    assert provider.generate('system','prompt',Transcript).segments[0].text == 'Speech.'
    assert seen[0].response_schema is None
    assert seen[0].response_json_schema['properties']['segments']['items']['type'] == 'object'
    def invalid(**kwargs):
        return SimpleNamespace(text='{"segments":[]}')
    monkeypatch.setattr(provider,'client',lambda:SimpleNamespace(models=SimpleNamespace(generate_content=invalid)))
    with pytest.raises(provider.ProviderUnavailable):
        provider.generate('system','prompt',Transcript)


def test_provider_quota_is_reported_without_retrying_processing(monkeypatch):
    class QuotaError(Exception):
        code = 429
    def quota(**kwargs):
        raise QuotaError()
    monkeypatch.setattr(provider,'client',lambda:SimpleNamespace(models=SimpleNamespace(generate_content=quota)))
    with pytest.raises(provider.ProviderQuotaExceeded,match='usage limit'):
        provider.generate('system','prompt',Transcript)
