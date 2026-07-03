import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4 text-center">
      <h1 className="mb-3 text-3xl font-semibold text-neutral-100">
        Multi-Workspace Document Assistant
      </h1>
      <p className="mb-8 max-w-md text-neutral-400">
        Upload documents into isolated workspaces and chat with an AI
        assistant that answers only from your workspace&apos;s content.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border border-neutral-700 px-5 py-2.5 text-sm font-medium text-neutral-200 hover:border-violet-500"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
