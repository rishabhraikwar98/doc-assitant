# AI Notes

## Tools and models used

Built primarily in conversation with Claude (Sonnet), used as a pair-programmer
for scaffolding, debugging, and working through a stream of dependency/API
churn (see below). I made the architectural and product decisions; Claude
wrote most of the boilerplate and helped diagnose failures, but every schema
choice, isolation strategy, and prompt design was reviewed and decided by me
before I ran it. No IDE-integrated AI tool (Cursor/Copilot) was used — this
was chat-driven development end to end.

## Key decisions I made

**1. Fixed-size chunking with overlap, not semantic/sentence-aware chunking.**
Given the timeline, I chose reliability over retrieval quality — a fixed
1000-character window with 150-character overlap is simple, has no edge
cases around malformed sentence boundaries, and is easy to reason about
when debugging isolation. I'd revisit this first if I had more time (see below).

**2. Isolation enforced at the query level, not just the app level.**
The workspace filter lives inside the `match_chunks` Postgres function
itself (`where chunks.workspace_id = match_workspace_id`, as part of the same
query that does the vector search), and is backed by RLS as a second layer.
This was a deliberate choice to satisfy the brief's explicit requirement that
the filter be part of the vector query, not a post-hoc filter in application
code — plus RLS means even a bug in my app code can't leak across workspaces,
since Postgres itself won't return rows the authenticated user doesn't own.

**3. Sequential embedding calls instead of batched.**
Gemini's `batchEmbedContents` endpoint has a much tighter free-tier rate limit
than I expected, and it defaults to 3072-dimensional output (I had to
explicitly truncate to 768 via `outputDimensionality` to match my schema).
I switched to one `embedContent` call per chunk with exponential backoff on
429s — slower, but far more reliable under free-tier constraints, which
matters more for a graded submission than ingestion speed.

## The hardest bug

The nastiest one wasn't in my code — it was in the schema I wrote (with
Claude's help) at the very start. My RLS policies covered `select`, `insert`,
and `delete` on the `documents` table, but I never added an `update` policy.
Ingestion needs to flip a document's status from `processing` to `ready`
after chunking/embedding succeeds — and RLS defaults to deny, so that update
was silently blocked. Worse, the API route didn't check the error on that
particular Supabase call, so it returned a 200 and the frontend showed
nothing wrong — documents just sat at "Processing..." forever with zero
errors anywhere: no red text in the browser, nothing in the server console.

I noticed it because I uploaded a document, waited, and the status never
changed even after the upload request had clearly finished. I diagnosed it
by explicitly asking whether the request was still pending (it wasn't) and
checking terminal output (nothing there either) — which pointed at a
silent failure rather than a slow one. The fix was two-fold: add the missing
RLS policy, and (more importantly) stop swallowing the error on that update
call so any future silent-failure-shaped bug would surface immediately
instead of hiding behind a green checkmark. It was a good reminder that
"the request succeeded" and "the request did what I think it did" are
different claims, especially with RLS in the mix.

Runner-up: I hit three separate instances of API/dependency drift mid-build —
Supabase deprecating anon/service_role keys in favor of publishable/secret,
Gemini deprecating `text-embedding-004` for `gemini-embedding-001` (with a
different default output dimension and a much stricter batch rate limit),
and `pdf-parse` doing a v1→v2 rewrite from a plain function to a class-based
API. None of these were logic bugs, but they were a good reminder that in a
fast-moving AI/tooling ecosystem, "the docs I remember" and "the docs that
are currently true" can diverge within months, and it's worth verifying
against current sources rather than trusting cached knowledge.

## What I'd improve or add with more time

- **Semantic/sentence-aware chunking** instead of fixed-size — should
  measurably improve citation precision, especially for documents with
  clear section structure.
- **Retrieval-debug view** — surfacing the raw `match_chunks` output
  (similarity scores per chunk, per workspace) as its own page, so isolation
  is provable at a glance rather than only inferable from chat behavior.
- **Streaming responses** — the chat currently waits for the full generation
  before showing anything but a typing indicator; token-by-token streaming
  would feel much more responsive, especially since tool-calling turns can
  take a few seconds.
- **Concurrency-limited (not fully sequential) embedding calls** — right now
  ingestion embeds one chunk at a time to stay under Gemini's free-tier
  rate limit; a small concurrency pool (e.g. 3–5 in flight) would speed up
  ingestion for larger documents without re-triggering the batch endpoint's
  rate-limit problems.
- **Hybrid search** — combining keyword search with vector similarity would
  help with queries containing exact terms/numbers that embedding similarity
  alone sometimes under-weights.