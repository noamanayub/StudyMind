from functools import lru_cache
import tiktoken
from app.documents.extractor import Section


@lru_cache
def encoder():
    return tiktoken.get_encoding('cl100k_base')


def chunk_sections(sections: list[Section], size: int, overlap: int) -> list[dict]:
    if not 0 <= overlap < size:
        raise ValueError('Invalid chunk overlap')
    chunks = []
    encoding = encoder()
    for section in sections:
        tokens = encoding.encode(section.text, disallowed_special=())
        for start in range(0, len(tokens), size - overlap):
            chunks.append({'content': encoding.decode(tokens[start:start + size]),
                           'page_number': section.page, 'section': section.title,
                           'chunk_index': len(chunks)})
            if start + size >= len(tokens):
                break
    if len(chunks) > 5000:
        raise ValueError('This document has too many sections. Split it into smaller files.')
    return chunks
