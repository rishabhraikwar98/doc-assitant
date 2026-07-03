export type Workspace = {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
};

export type Document = {
  id: string;
  workspace_id: string;
  filename: string;
  content_hash: string;
  status: "processing" | "ready" | "failed";
  created_at: string;
};

export type Citation = {
  document_id: string;
  filename: string;
  chunk_id: string;
  snippet: string;
};

export type ChatMessage = {
  id: string;
  workspace_id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  created_at: string;
};

export type Task = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  status: "open" | "done";
  created_at: string;
};

export type ToolCall = {
  id: string;
  workspace_id: string;
  tool_name: string;
  arguments: Record<string, unknown>;
  status: "success" | "error";
  result: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
};
