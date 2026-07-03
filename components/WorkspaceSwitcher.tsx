"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Workspace } from "@/lib/types";

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
      <select
        value={activeId}
        onChange={(e) => router.push(`/dashboard/${e.target.value}`)}
        className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-violet-500"
      >
        {workspaces.map((ws) => (
          <option key={ws.id} value={ws.id}>
            {ws.name}
          </option>
        ))}
      </select>

      {creating ? (
        <form onSubmit={handleCreate} className="flex gap-1">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workspace name"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100 outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-violet-600 px-2 text-sm text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {loading ? "..." : "Add"}
          </button>
        </form>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="w-full rounded-lg border border-dashed border-neutral-700 py-1.5 text-xs text-neutral-400 hover:border-violet-500 hover:text-violet-400"
        >
          + New workspace
        </button>
      )}
    </div>
  );
}
