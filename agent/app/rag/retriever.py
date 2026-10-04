from app.core.database import connection
from app.core.config import settings
from app.llm.client import embed
from pgvector import Vector


def retrieve(user_id: str, question: str, scope: str, workspace_id=None, document_ids=None):
    vector = Vector(embed([question], 'RETRIEVAL_QUERY')[0])
    conditions = ['d.user_id = %s', "d.status = 'READY'", 'c.embedding_model = %s']
    values = [user_id, settings.embedding_model]
    if scope == 'workspace':
        conditions.append('d.workspace_id = %s')
        values.append(workspace_id)
    elif scope == 'documents':
        conditions.append('d.id = ANY(%s::uuid[])')
        values.append(document_ids or [])
    query = '''SELECT c.id, c.document_id, c.content, c.page_number, c.section,
               d.original_name, 1 - (c.embedding <=> %s) AS similarity
               FROM document_chunks c JOIN documents d ON d.id = c.document_id
               WHERE ''' + ' AND '.join(conditions) + ' ORDER BY c.embedding <=> %s LIMIT %s'
    with connection() as conn:
        rows = conn.execute(query, [vector, *values, vector, settings.retrieved_chunks]).fetchall()
    return [r for r in rows if r['similarity'] >= settings.min_similarity]
