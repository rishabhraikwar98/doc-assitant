"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import type { ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ChatPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/workspaces/${workspaceId}/chat`);
    const data = await res.json();
    if (res.ok) setMessages(data.messages);
  }, [workspaceId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const question = input;
    setInput("");
    setSending(true);
    setError(null);

    // Optimistically show the user's message right away — the API
    // persists it before anything else, so a refresh won't lose it
    // even if the request below fails.
    setMessages((prev) => [
      ...prev,
      {
        id: `optimistic-${Date.now()}`,
        workspace_id: workspaceId,
        role: "user",
        content: question,
        citations: [],
        created_at: new Date().toISOString(),
      },
    ]);

    const res = await fetch(`/api/workspaces/${workspaceId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: question }),
    });
    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setError(
        data.error ??
          "Something went wrong. Your question was saved — try sending again.",
      );
      await loadMessages(); // reload to replace optimistic message with the real persisted one
      return;
    }

    await loadMessages();
  }

  return (
    <div className="flex max-h-screen flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-8">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Ask a question about the documents in this workspace.
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[70%] ${msg.role === "user" ? "" : "w-full"}`}
            >
              <Card
                className={
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }
              >
                <CardContent className="p-3 text-sm whitespace-pre-wrap">
                  {msg.content}
                </CardContent>
              </Card>

              {msg.role === "assistant" && msg.citations?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.citations.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-md border bg-background/50 p-2 text-xs text-muted-foreground"
                    >
                      <span className="font-medium">
                        [Source {i + 1}] {c.filename}
                      </span>
                      <p className="mt-0.5 truncate">{c.snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <Card className="bg-muted">
              <CardContent className="flex items-center gap-1 p-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="border-t bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSend}
        className="flex gap-2 items-center border-t p-3 sm:p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your documents..."
          disabled={sending}
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50"
        />
        <Button type="submit" disabled={sending || !input.trim()}>
          {sending ? "..." : "Send"}
        </Button>
      </form>
    </div>
  );
}
