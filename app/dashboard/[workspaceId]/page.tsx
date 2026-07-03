export default async function ChatPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  return (
    <div className="flex h-screen flex-col items-center justify-center text-neutral-500">
      <p className="text-sm">Chat UI coming in Phase 3</p>
      <p className="mt-1 text-xs text-neutral-600">workspace: {workspaceId}</p>
    </div>
  );
}
