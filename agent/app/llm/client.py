from functools import lru_cache
import math
import logging
from google import genai
from google.genai import types
from app.core.config import settings


class ProviderUnavailable(RuntimeError):
    pass


class ProviderQuotaExceeded(ProviderUnavailable):
    pass


def wire_schema(model):
    """Keep provider schemas simple; enforce every constraint again with Pydantic."""
    root = model.model_json_schema()
    def convert(node, depth=0):
        if depth > 32:
            raise ValueError('Structured output schema is too deeply nested.')
        if '$ref' in node:
            return convert(root['$defs'][node['$ref'].split('/')[-1]], depth + 1)
        result = {key: node[key] for key in ('type', 'enum', 'required', 'description') if key in node}
        if 'properties' in node:
            result['properties'] = {key: convert(value, depth + 1) for key, value in node['properties'].items()}
        if 'items' in node:
            result['items'] = convert(node['items'], depth + 1)
        if 'anyOf' in node:
            result['anyOf'] = [convert(value, depth + 1) for value in node['anyOf']]
        return result
    return convert(root)


@lru_cache
def client():
    if not settings.llm_api_key:
        raise ProviderUnavailable('Study Mind needs a Gemini API key configured on the server.')
    return genai.Client(api_key=settings.llm_api_key, http_options=types.HttpOptions(
        timeout=45000,
        retry_options=types.HttpRetryOptions(attempts=2, initial_delay=1, max_delay=3,
                                            http_status_codes=[500, 502, 503, 504])))


def embed(texts: list[str], task: str) -> list[list[float]]:
    try:
        result = client().models.embed_content(model=settings.embedding_model, contents=texts,
                  config=types.EmbedContentConfig(task_type=task, output_dimensionality=settings.embedding_dimensions))
        vectors = []
        for item in result.embeddings:
            vector = item.values
            if len(vector) != settings.embedding_dimensions or not all(math.isfinite(v) for v in vector):
                raise ValueError('Invalid embedding')
            length = math.sqrt(sum(v * v for v in vector))
            if not length:
                raise ValueError('Empty embedding')
            vectors.append([v / length for v in vector])
        if len(vectors) != len(texts):
            raise ValueError('Embedding count mismatch')
        return vectors
    except ProviderUnavailable:
        raise
    except Exception as error:
        if getattr(error, 'code', None) == 429:
            raise ProviderQuotaExceeded('AI is temporarily at its usage limit. Please try again after the provider limit resets.') from error
        raise ProviderUnavailable('Embedding service is unavailable. Please try again shortly.') from error


def generate(system: str, prompt: str, schema: type, max_output_tokens=4096):
    try:
        result = client().models.generate_content(model=settings.llm_model, contents=prompt,
            config=types.GenerateContentConfig(system_instruction=system, temperature=0.2,
                   max_output_tokens=max_output_tokens, response_mime_type='application/json', response_json_schema=wire_schema(schema)))
        return schema.model_validate_json(result.text)
    except ProviderUnavailable:
        raise
    except Exception as error:
        logging.getLogger('study_mind.provider').warning('generation_failed type=%s code=%s', type(error).__name__, getattr(error, 'code', None))
        if getattr(error, 'code', None) == 429:
            raise ProviderQuotaExceeded('AI is temporarily at its usage limit. Please try again after the provider limit resets.') from error
        raise ProviderUnavailable('The answer service is unavailable. Please try again shortly.') from error
