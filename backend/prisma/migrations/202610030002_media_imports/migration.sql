ALTER TABLE documents ADD COLUMN extraction_mode TEXT NOT NULL DEFAULT 'TEXT', ADD COLUMN source_url TEXT;
ALTER TABLE documents ADD CONSTRAINT document_extraction_modes CHECK (extraction_mode IN ('TEXT','VISION','AUDIO','YOUTUBE'));
CREATE TABLE research_reports (
 id UUID PRIMARY KEY,user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,request_id UUID NOT NULL,
 query TEXT NOT NULL,content TEXT NOT NULL,sources JSONB NOT NULL,supports JSONB NOT NULL,suggestions_html TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,request_id)
);
CREATE INDEX research_reports_user_id_created_at_idx ON research_reports(user_id,created_at);
