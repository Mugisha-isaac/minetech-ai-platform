-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────
-- VECTOR STORE TABLE (for Spring AI)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vector_store (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content         TEXT NOT NULL,
    metadata        JSONB,
    embedding       vector(768),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vector_store_embedding
    ON vector_store USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ─────────────────────────────────────────
-- TRIAGE TICKETS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS triage_tickets (
    id              BIGSERIAL PRIMARY KEY,
    raw_input       TEXT NOT NULL,
    category        VARCHAR(100),
    priority        VARCHAR(20) CHECK (priority IN ('CRITICAL','HIGH','MEDIUM','LOW')),
    location        VARCHAR(255),
    affected_system VARCHAR(255),
    reported_by     VARCHAR(255),
    summary         TEXT,
    suggested_reply TEXT,
    raw_llm_output  TEXT,
    parse_error     TEXT,
    status          VARCHAR(20) DEFAULT 'PROCESSED' CHECK (status IN ('PROCESSED','PARSE_ERROR','PENDING')),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_triage_category ON triage_tickets(category);
CREATE INDEX IF NOT EXISTS idx_triage_priority ON triage_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_triage_status   ON triage_tickets(status);
CREATE INDEX IF NOT EXISTS idx_triage_created  ON triage_tickets(created_at DESC);

-- ─────────────────────────────────────────
-- KNOWLEDGE BASE DOCUMENTS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kb_documents (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(500) NOT NULL,
    filename    VARCHAR(500),
    content     TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- DOCUMENT CHUNKS TABLE (for RAG)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kb_chunks (
    id          BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content     TEXT NOT NULL,
    embedding   vector(768),         -- nomic-embed-text produces 768-dim vectors
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chunks_document ON kb_chunks(document_id);
-- IVFFlat index for approximate nearest-neighbour search
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
    ON kb_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ─────────────────────────────────────────
-- CHAT SESSIONS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title      VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CHAT MESSAGES TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
    id          BIGSERIAL PRIMARY KEY,
    session_id  UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role        VARCHAR(20) CHECK (role IN ('USER','ASSISTANT')),
    content     TEXT NOT NULL,
    citations   JSONB,               -- [{document_title, chunk_index, excerpt}]
    grounded    BOOLEAN DEFAULT TRUE, -- false = answer not found in KB
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id);

-- ─────────────────────────────────────────
-- SEED: sample knowledge base document
-- ─────────────────────────────────────────
INSERT INTO kb_documents (title, filename, content) VALUES (
    'MineTech Safety Policy v2.1',
    'safety_policy_v2.1.txt',
    'Section 1: General Safety Requirements
All personnel entering mine sites must complete a safety induction before beginning work.
Emergency exits must remain unobstructed at all times.

Section 2: Personal Protective Equipment (PPE)
2.1 Hard hats rated to EN 397 standard are mandatory in all operational zones.
2.2 High-visibility vests must be worn in vehicle-accessible areas.
2.3 Safety boots with steel toe caps (S3 rated) are required at all times on site.
2.4 Eye protection (EN 166) is mandatory when operating drilling or blasting equipment.
2.5 Hearing protection must be worn in areas exceeding 85 dB — indicated by yellow signage.

Section 3: Incident Reporting
3.1 All incidents, near-misses, and hazards must be reported within 2 hours of occurrence.
3.2 Incident reports must be submitted via the MineTech Operations Platform.
3.3 Critical incidents (injuries, structural failures, chemical spills) require immediate phone notification to the Site Safety Officer.

Section 4: Equipment Operation
4.1 Only certified operators may operate heavy machinery.
4.2 Pre-shift equipment inspections are mandatory and must be logged.
4.3 Equipment faults must be tagged and reported before the machine is taken out of service.
4.4 Conveyor systems must be locked out before any maintenance work begins (LOTO procedure).

Section 5: Hazardous Materials
5.1 Material Safety Data Sheets (MSDS) must be available at all chemical storage points.
5.2 Spillage response kits must be positioned within 10 metres of any chemical storage area.
5.3 Disposal of hazardous waste must comply with national environmental regulations.'
) ON CONFLICT DO NOTHING;
