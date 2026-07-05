# Multi-Workspace Document Assistant

A RAG-powered document assistant with strict workspace isolation, grounded chat
with citations, and tool calling — built with Next.js, Supabase (Postgres +
pgvector), and the Gemini API.

**Live URL:** [https://doc-assitant.vercel.app/login]
**Throwaway login:** email: `[rishabh.raikwar.work@gmail.com]` / password: `[Pass@123]`
(or: sign up fresh — signup is open)

## What it does

- Sign in, create multiple workspaces, switch between them
- Upload PDF/DOCX/TXT/MD documents into a workspace — they're chunked, embedded,
  and stored in a single shared `chunks` table tagged by `workspace_id`
- Ask questions in the chat — answers are grounded only in the active
  workspace's documents, with inline citations back to source chunks
- If the workspace's documents don't contain the answer, the assistant says so
  instead of guessing
- The assistant can call two tools: `save_task` (creates a real task row in
  the active workspace) and `notify_channel` (posts to a Discord webhook)
- A Tool Call Log shows every invocation, success or failure

## Testing the isolation guarantee

This is the property most worth checking directly:
1. Create workspace A, upload a document with a distinctive fact in it
   (e.g. a made-up figure or name that only exists in that doc)
2. Ask the assistant about that fact in workspace A — it should answer with a citation
3. Switch to workspace B (a different/empty workspace)
4. Ask the same question — it should say the documents don't contain the answer,
   not leak the fact from A

## Stack

- **Frontend/Backend:** Next.js 16 (App Router), Tailwind, shadcn/ui
- **Auth + DB:** Supabase (Postgres + pgvector + Auth), RLS on every table
- **LLM + embeddings:** Gemini API — `gemini-2.5-flash` for chat/tool calling,
  `gemini-embedding-001` for embeddings (truncated to 768 dims)
- **Deployment:** Vercel

## Running locally

```bash
git clone [https://github.com/rishabhraikwar98/doc-assitant]
cd doc-assistant
npm install
cp .env.example .env.local
# fill in .env.local — see below
```

Run the schema against a Supabase project (SQL Editor → paste `db/schema.sql`):
```sql
create extension if not exists vector;
-- then the rest of db/schema.sql
```

```bash
npm run dev
```

## Environment variables

See `.env.example`. You'll need:
- A Supabase project — **Settings → API Keys** tab (the new key format, not
  the legacy anon/service_role keys, which Supabase has deprecated for new
  projects). You need the **publishable** key (client-safe) and the
  **secret** key (server-only, bypasses RLS — never expose this).
- A Gemini API key from [aistudio.google.com](https://aistudio.google.com) — free tier, no card.
- (Optional) A Discord Incoming Webhook URL for the `notify_channel` tool.
  If unset, that tool fails gracefully and logs the failure — it doesn't
  crash the app.

## Deployment notes

Deployed to Vercel. Two things that mattered specifically for this app:

1. **`serverExternalPackages: ["pdf-parse"]`** in `next.config.ts` — without
   this, Next's bundler breaks `pdf-parse`'s worker file resolution.
2. **`maxDuration`** set on the document ingestion route — ingestion makes
   one Gemini embedding call per chunk (sequential, with retry/backoff, to
   avoid the batch endpoint's tighter free-tier rate limit), so a
   multi-chunk document can take longer than Vercel's default 5–10s
   Hobby timeout. Fluid Compute is enabled on the Vercel project to raise
   this ceiling.

## Sample documents for testing

[Add 1–2 short sample docs here, or describe what you preloaded into the
two demo workspaces, so a reviewer doesn't have to hunt for something to upload]

## What's not implemented (stretch goals not attempted)

- Hybrid search / re-ranking
- Streaming responses
- Explicit cross-workspace document sharing
- Formal observability (token counts, latency dashboards)

See `AI_NOTES.md` for what I'd prioritize next with more time.