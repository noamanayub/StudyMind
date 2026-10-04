ALTER TABLE documents ADD CONSTRAINT document_status_valid CHECK (status IN ('PROCESSING', 'READY', 'FAILED'));
ALTER TABLE processing_jobs ADD CONSTRAINT job_state_valid CHECK (state IN ('PENDING', 'RUNNING', 'DONE', 'FAILED'));
ALTER TABLE conversations ADD CONSTRAINT conversation_scope_valid CHECK (scope IN ('all', 'workspace', 'documents'));
ALTER TABLE messages ADD CONSTRAINT message_role_valid CHECK (role IN ('USER', 'ASSISTANT'));
ALTER TABLE documents ADD CONSTRAINT document_size_positive CHECK (file_size > 0);
