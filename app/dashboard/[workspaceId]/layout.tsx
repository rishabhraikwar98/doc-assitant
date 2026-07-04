import { redirect, notFound } from "next/navigation";
import { Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";
import SignOutButton from "@/components/SignOutButton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import DashboardNav from "@/components/DashboardNav";
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

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: true });

  if (!workspaces || workspaces.length === 0) redirect("/dashboard/new");

  const activeWorkspace = workspaces.find((w) => w.id === workspaceId);
  if (!activeWorkspace) notFound();

  const sidebarContent = (
    <div className="flex h-full flex-col gap-1 p-5">
      <div className="mb-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
          Workspace
        </p>
        <WorkspaceSwitcher workspaces={workspaces} activeId={workspaceId} />
      </div>
      <DashboardNav workspaceId={workspaceId} />
      <div className="border-t pt-4">
        <p className="mb-2 truncate text-xs text-muted-foreground">
          {user.email}
        </p>
        <SignOutButton />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b p-3 md:hidden">
        <span className="text-sm font-medium">{activeWorkspace.name}</span>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 border-r md:block">
        {sidebarContent}
      </aside>

      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
