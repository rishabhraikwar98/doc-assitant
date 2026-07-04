import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const TOOL_DECLARATIONS = [
  {
    name: "save_task",
    description:
      "Save a task/to-do item into this workspace's task list. Use when the user asks to remember, track, or create a task/reminder based on the conversation or documents.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "Short task title, max 200 characters" },
        description: { type: "STRING", description: "Optional longer description or context" },
      },
      required: ["title"],
    },
  },
  {
    name: "notify_channel",
    description:
      "Send a short summary message to this workspace's configured notification channel. Use only when the user explicitly asks to notify, alert, or send a summary somewhere.",
    parameters: {
      type: "OBJECT",
      properties: {
        message: { type: "STRING", description: "The message to send, max 1000 characters" },
      },
      required: ["message"],
    },
  },
];

const saveTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

const notifySchema = z.object({
  message: z.string().min(1).max(1000),
});

export type ToolResult = {
  ok: boolean;
  data?: unknown;
  error?: string;
};

// Validates arguments against a schema BEFORE executing anything, and logs
// every call — success or failure — to tool_calls. This is the "safe tool
// execution" requirement: malformed args or an unknown tool name never
// crash the request, they just log as a failed call.
export async function executeTool(
  workspaceId: string,
  toolName: string,
  rawArgs: unknown
): Promise<ToolResult> {
  const supabase = await createClient();

  async function logCall(status: "success" | "error", result: unknown, errorMessage?: string) {
    await supabase.from("tool_calls").insert({
      workspace_id: workspaceId,
      tool_name: toolName,
      arguments: (rawArgs as Record<string, unknown>) ?? {},
      status,
      result: result ?? null,
      error_message: errorMessage ?? null,
    });
  }

  if (toolName === "save_task") {
    const parsed = saveTaskSchema.safeParse(rawArgs);
    if (!parsed.success) {
      const message = `Invalid arguments for save_task: ${parsed.error.message}`;
      await logCall("error", null, message);
      return { ok: false, error: message };
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        workspace_id: workspaceId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
      })
      .select()
      .single();

    if (error) {
      await logCall("error", null, error.message);
      return { ok: false, error: error.message };
    }
    await logCall("success", data);
    return { ok: true, data };
  }

  if (toolName === "notify_channel") {
    const parsed = notifySchema.safeParse(rawArgs);
    if (!parsed.success) {
      const message = `Invalid arguments for notify_channel: ${parsed.error.message}`;
      await logCall("error", null, message);
      return { ok: false, error: message };
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      // Graceful failure: no webhook configured yet isn't a crash, it's a
      // logged, explainable failure the model can report back honestly.
      const message = "Notification channel is not configured for this deployment.";
      await logCall("error", null, message);
      return { ok: false, error: message };
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: parsed.data.message }),
      });
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
      await logCall("success", { sent: true });
      return { ok: true, data: { sent: true } };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send notification";
      await logCall("error", null, message);
      return { ok: false, error: message };
    }
  }

  // The model hallucinated a tool name that doesn't exist — log it,
  // don't crash, don't execute anything.
  const message = `Unknown tool: ${toolName}`;
  await logCall("error", null, message);
  return { ok: false, error: message };
}