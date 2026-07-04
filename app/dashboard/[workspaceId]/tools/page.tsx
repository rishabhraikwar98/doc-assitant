"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { ToolCall } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ToolsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [calls, setCalls] = useState<ToolCall[]>([]);

  useEffect(() => {
    fetch(`/api/workspaces/${workspaceId}/tools`)
      .then((res) => res.json())
      .then((data) => setCalls(data.toolCalls ?? []));
  }, [workspaceId]);

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-8">
      <h1 className="mb-1 text-xl font-semibold">Tool Call Log</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Every tool invocation from this workspace, success or failure.
      </p>

      <div className="space-y-2">
        {calls.length === 0 && (
          <p className="text-sm text-muted-foreground">No tool calls yet.</p>
        )}
        {calls.map((call) => (
          <Card key={call.id}>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-sm">{call.tool_name}</span>
                <Badge variant={call.status === "success" ? "default" : "destructive"}>
                  {call.status}
                </Badge>
              </div>
              <pre className="mb-1 overflow-x-auto rounded bg-muted p-2 text-xs">
                {JSON.stringify(call.arguments, null, 2)}
              </pre>
              {call.status === "success" ? (
                <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
                  {JSON.stringify(call.result, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-destructive">{call.error_message}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(call.created_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}