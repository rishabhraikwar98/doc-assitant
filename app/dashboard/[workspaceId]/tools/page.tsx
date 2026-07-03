export default async function ToolsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  return (
    <div className="flex h-screen flex-col items-center justify-center text-neutral-500">
      <p className="text-sm">Tool call log coming in Phase 4</p>
      <p className="mt-1 text-xs text-neutral-600">workspace: {workspaceId}</p>
    </div>
  );
}
