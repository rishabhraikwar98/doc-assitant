import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardRoot() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1);

  if (workspaces && workspaces.length > 0) {
    redirect(`/dashboard/${workspaces[0].id}`);
  }

  // No workspaces yet — send to a dedicated onboarding screen
  redirect("/dashboard/new");
}
