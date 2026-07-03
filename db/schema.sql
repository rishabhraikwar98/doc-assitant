-- ============================================================
-- Multi-Workspace Document Assistant — Schema
-- Run this in Supabase SQL Editor after enabling the vector extension:
--   create extension if not exists vector;
-- ============================================================

create extension if not exists vector;

-- ------------------------------------------------------------
-- Workspaces
-- ------------------------------------------------------------
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table workspaces enable row level security;

create policy "Users can view their own workspaces"
  on workspaces for select
  using (owner_id = auth.uid());

create policy "Users can create their own workspaces"
  on workspaces for insert
  with check (owner_id = auth.uid());

create policy "Users can update their own workspaces"
  on workspaces for update
  using (owner_id = auth.uid());

create policy "Users can delete their own workspaces"
  on workspaces for delete
  using (owner_id = auth.uid());

-- ------------------------------------------------------------
-- Documents (metadata only — raw text lives in chunks)
-- ------------------------------------------------------------
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  filename text not null,
  content_hash text not null, -- sha256 of raw bytes, used for idempotent re-upload
  status text not null default 'processing', -- processing | ready | failed
  created_at timestamptz not null default now(),
  unique (workspace_id, content_hash) -- re-uploading the same file in the same workspace is a no-op
);

alter table documents enable row level security;

create policy "Users can view documents in their workspaces"
  on documents for select
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "Users can insert documents in their workspaces"
  on documents for insert
  with check (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "Users can delete documents in their workspaces"
  on documents for delete
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

-- ------------------------------------------------------------
-- Chunks — THE SHARED VECTOR STORE.
-- One table for every workspace's chunks. workspace_id is the
-- tenancy boundary and MUST be part of every similarity query.
-- Gemini text-embedding-004 produces 768-dim vectors.
-- ------------------------------------------------------------
create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(768) not null,
  created_at timestamptz not null default now()
);

-- IVFFlat index for fast approximate nearest-neighbor search.
-- Partial-safe: workspace filter is applied in the WHERE clause of the
-- retrieval query below, not bolted on after fetching global results.
create index if not exists chunks_embedding_idx
  on chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists chunks_workspace_idx on chunks (workspace_id);

alter table chunks enable row level security;

create policy "Users can view chunks in their workspaces"
  on chunks for select
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "Users can insert chunks in their workspaces"
  on chunks for insert
  with check (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "Users can delete chunks in their workspaces"
  on chunks for delete
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

-- ------------------------------------------------------------
-- Chat messages (per workspace history)
-- ------------------------------------------------------------
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  role text not null, -- user | assistant
  content text not null,
  citations jsonb default '[]'::jsonb, -- [{document_id, filename, chunk_id, snippet}]
  created_at timestamptz not null default now()
);

alter table chat_messages enable row level security;

create policy "Users can view chat in their workspaces"
  on chat_messages for select
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "Users can insert chat in their workspaces"
  on chat_messages for insert
  with check (workspace_id in (select id from workspaces where owner_id = auth.uid()));

-- ------------------------------------------------------------
-- Tasks — the real side-effect target for the save_task tool
-- ------------------------------------------------------------
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open', -- open | done
  created_at timestamptz not null default now()
);

alter table tasks enable row level security;

create policy "Users can view tasks in their workspaces"
  on tasks for select
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "Users can insert tasks in their workspaces"
  on tasks for insert
  with check (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "Users can update tasks in their workspaces"
  on tasks for update
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

-- ------------------------------------------------------------
-- Tool call log — every tool invocation, success or failure
-- ------------------------------------------------------------
create table if not exists tool_calls (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  tool_name text not null,
  arguments jsonb not null,
  status text not null, -- success | error
  result jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

alter table tool_calls enable row level security;

create policy "Users can view tool calls in their workspaces"
  on tool_calls for select
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "Users can insert tool calls in their workspaces"
  on tool_calls for insert
  with check (workspace_id in (select id from workspaces where owner_id = auth.uid()));

-- ------------------------------------------------------------
-- Retrieval function — the isolation boundary lives HERE.
-- The workspace filter is a WHERE clause inside the same query
-- that does the vector search, not a post-hoc filter in app code.
-- ------------------------------------------------------------
create or replace function match_chunks (
  query_embedding vector(768),
  match_workspace_id uuid,
  match_count int default 5
)
returns table (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  similarity float
)
language sql stable
as $$
  select
    chunks.id,
    chunks.document_id,
    chunks.chunk_index,
    chunks.content,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from chunks
  where chunks.workspace_id = match_workspace_id -- <-- the tenancy boundary
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;
