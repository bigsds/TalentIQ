-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create n8n schema for N8n tables
CREATE SCHEMA IF NOT EXISTS n8n;

-- Grant permissions
GRANT ALL ON SCHEMA n8n TO CURRENT_USER;
GRANT ALL ON SCHEMA public TO CURRENT_USER;
