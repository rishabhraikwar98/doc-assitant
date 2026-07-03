import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";
import SignOutButton from "@/components/SignOutButton";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ownership check happens via RLS (the select below only ever returns
  // rows owned by the current user) AND explicitly here, so a bad/foreign
  // workspaceId in the URL 404s instead of silently rendering empty state.
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: true });

  if (!workspaces || workspaces.length === 0) redirect("/dashboard/new");

  const activeWorkspace = workspaces.find((w) => w.id === workspaceId);
  if (!activeWorkspace) notFound();

  const nav = [
    { href: `/dashboard/${workspaceId}`, label: "Chat" },
    { href: `/dashboard/${workspaceId}/documents`, label: "Documents" },
    { href: `/dashboard/${workspaceId}/tools`, label: "Tool Log" },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-950">
      <aside className="flex w-64 flex-col border-r border-neutral-800 p-4">
        <div className="mb-6">
          <p className="mb-2 text-xs uppercase tracking-wide text-neutral-500">
            Workspace
          </p>
          <WorkspaceSwitcher workspaces={workspaces} activeId={workspaceId} />
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-neutral-800 pt-4">
          <p className="mb-2 truncate text-xs text-neutral-500">{user.email}</p>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
