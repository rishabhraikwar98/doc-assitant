import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { extractText } from "@/lib/parsing";
import { chunkText } from "@/lib/chunking";
import { embedTexts } from "@/lib/gemini";

export const runtime = "nodejs"; // pdf-parse/mammoth need Node, not Edge
export const maxDuration = 60; // Vercel Hobby max without Fluid Compute

const ALLOWED_EXT = ["pdf", "txt", "md", "docx"];
const MAX_BYTES = 8 * 1024 * 1024; // 8MB — keep well under serverless body limits

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RLS scopes this to workspaces the user owns; workspaceId in the
  // WHERE clause additionally makes sure we return the right workspace's
  // docs specifically, not just "some doc the user owns".
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Confirm the workspace is actually the user's before writing anything.
  // RLS backs this up, but failing fast here gives a clean 403 instead of
  // a confusing empty-insert.
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .eq("owner_id", user.id)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  if (!ALLOWED_EXT.includes(ext)) {
    return NextResponse.json(
      { error: `Unsupported file type. Allowed: ${ALLOWED_EXT.join(", ")}` },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 8MB)" },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentHash = crypto.createHash("sha256").update(buffer).digest("hex");

  // Idempotent ingestion: (workspace_id, content_hash) is a unique
  // constraint in the schema. Insert first; if it collides, the exact
  // same file was already ingested into this workspace — return the
  // existing row instead of re-embedding.
  const { data: doc, error: insertError } = await supabase
    .from("documents")
    .insert({
      workspace_id: workspaceId,
      filename: file.name,
      content_hash: contentHash,
      status: "processing",
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: existing } = await supabase
        .from("documents")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("content_hash", contentHash)
        .single();
      return NextResponse.json({ document: existing, deduped: true });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  try {
    const text = await extractText(buffer, file.name);
    if (!text.trim()) {
      throw new Error("No extractable text found in file");
    }

    const chunks = chunkText(text);
    if (chunks.length === 0) {
      throw new Error("Chunking produced no chunks");
    }

    const embeddings = await embedTexts(chunks);

    const rows = chunks.map((content, i) => ({
      workspace_id: workspaceId,
      document_id: doc.id,
      chunk_index: i,
      content,
      embedding: embeddings[i],
    }));

    // Batch insert in groups to stay well under request size limits.
    const INSERT_BATCH = 200;
    for (let i = 0; i < rows.length; i += INSERT_BATCH) {
      const { error: chunkError } = await supabase
        .from("chunks")
        .insert(rows.slice(i, i + INSERT_BATCH));
      if (chunkError) throw new Error(chunkError.message);
    }

    const { data: updatedDoc, error: updateError } = await supabase
      .from("documents")
      .update({ status: "ready" })
      .eq("id", doc.id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ document: updatedDoc });
  } catch (err) {
    // Ingestion failed partway — mark the document failed rather than
    // leaving it stuck at "processing" forever. User's upload attempt
    // isn't silently lost; they see the failure and can retry.
    await supabase
      .from("documents")
      .update({ status: "failed" })
      .eq("id", doc.id);
    const message = err instanceof Error ? err.message : "Ingestion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!documentId)
    return NextResponse.json({ error: "Missing documentId" }, { status: 400 });

  // Deleting the document cascades to its chunks via the FK constraint.
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("workspace_id", workspaceId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
