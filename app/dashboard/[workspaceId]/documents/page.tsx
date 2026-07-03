"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import type { Document } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DocumentsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    const res = await fetch(`/api/workspaces/${workspaceId}/documents`);
    const data = await res.json();
    if (res.ok) setDocuments(data.documents);
  }, [workspaceId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // allow re-selecting the same file later

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/workspaces/${workspaceId}/documents`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    setUploading(false);
    if (!res.ok) {
      setError(data.error ?? "Upload failed");
      return;
    }
    await loadDocuments();
  }

  async function handleDelete(documentId: string) {
    await fetch(
      `/api/workspaces/${workspaceId}/documents?documentId=${documentId}`,
      {
        method: "DELETE",
      },
    );
    await loadDocuments();
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-8">
      <h1 className="mb-1 text-xl font-semibold">Documents</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        PDF, TXT, MD, or DOCX. Chunked and embedded into this workspace only.
      </p>

      <label className="mb-6 flex cursor-pointer items-center justify-center rounded-lg border border-dashed py-8 text-sm text-muted-foreground hover:border-primary hover:text-primary">
        {uploading ? "Uploading..." : "Tap to upload a document"}
        <input
          type="file"
          accept=".pdf,.txt,.md,.docx"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        {documents.length === 0 && (
          <p className="text-sm text-muted-foreground">No documents yet.</p>
        )}
        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm">{doc.filename}</p>
                <Badge
                  variant={
                    doc.status === "ready"
                      ? "default"
                      : doc.status === "failed"
                        ? "destructive"
                        : "secondary"
                  }
                  className="mt-1"
                >
                  {doc.status}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(doc.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
