"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Workspace } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function WorkspaceSwitcher({
  workspaces,
  activeId,
}: {
  workspaces: Workspace[];
  activeId: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setCreating(false);
      setName("");
      router.push(`/dashboard/${data.workspace.id}`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-2">
      <Select
        value={activeId}
        onValueChange={(v) => router.push(`/dashboard/${v}`)}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-50 border bg-background shadow-lg">
          {workspaces.map((ws) => (
            <SelectItem className="cursor-pointer" key={ws.id} value={ws.id}>
              {ws.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {creating ? (
        <form onSubmit={handleCreate} className="space-y-2">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workspace name"
            className="h-9 text-sm"
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Adding..." : "Add"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setCreating(false);
                setName("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full border-dashed text-xs"
          onClick={() => setCreating(true)}
        >
          + New workspace
        </Button>
      )}
    </div>
  );
}
