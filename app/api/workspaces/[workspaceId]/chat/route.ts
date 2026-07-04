import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embedQuery, generateGroundedAnswer, generateWithTools, type RetrievedChunk } from "@/lib/gemini";
import { RETRIEVAL_SIMILARITY_THRESHOLD } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Confirm ownership before doing anything else.
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .eq("owner_id", user.id)
    .single();
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const question = typeof body?.message === "string" ? body.message.trim() : "";
  if (!question) return NextResponse.json({ error: "Message is required" }, { status: 400 });

  // Save the user's message FIRST, before any LLM call. If the LLM call
  // fails below, the question itself is never lost — it's already
  // persisted and will show up on refresh, ready to retry against.
  const { error: userMsgError } = await supabase.from("chat_messages").insert({
    workspace_id: workspaceId,
    role: "user",
    content: question,
  });
  if (userMsgError) {
    return NextResponse.json({ error: userMsgError.message }, { status: 500 });
  }
try {
    const queryEmbedding = await embedQuery(question);

    const { data: matches, error: matchError } = await supabase.rpc("match_chunks", {
      query_embedding: queryEmbedding,
      match_workspace_id: workspaceId,
      match_count: 5,
    });
    if (matchError) throw new Error(matchError.message);

    const relevant = (matches ?? []).filter(
      (m: { similarity: number }) => m.similarity >= RETRIEVAL_SIMILARITY_THRESHOLD
    );

    let chunksForPrompt: RetrievedChunk[] = [];
    let citations: Array<{ document_id: string; filename: string; chunk_id: string; snippet: string }> = [];

    if (relevant.length > 0) {
      const documentIds = [...new Set(relevant.map((m: { document_id: string }) => m.document_id))];
      const { data: docs } = await supabase.from("documents").select("id, filename").in("id", documentIds);
      const filenameById = new Map((docs ?? []).map((d) => [d.id, d.filename]));

      chunksForPrompt = relevant.map((m: any) => ({
        id: m.id,
        document_id: m.document_id,
        filename: filenameById.get(m.document_id) ?? "unknown",
        content: m.content,
        similarity: m.similarity,
      }));

      citations = chunksForPrompt.map((c) => ({
        document_id: c.document_id,
        filename: c.filename,
        chunk_id: c.id,
        snippet: c.content.slice(0, 200),
      }));
    }

    const { answer, toolCalls } = await generateWithTools(question, chunksForPrompt, workspaceId);

    const { data: assistantMsg, error: assistantError } = await supabase
      .from("chat_messages")
      .insert({ workspace_id: workspaceId, role: "assistant", content: answer, citations })
      .select()
      .single();
    if (assistantError) throw new Error(assistantError.message);

    return NextResponse.json({ message: assistantMsg, toolCalls });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate answer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}