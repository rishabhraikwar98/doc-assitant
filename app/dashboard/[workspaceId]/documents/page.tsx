export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  return (
    <div className="flex h-screen flex-col items-center justify-center text-neutral-500">
      <p className="text-sm">Document upload coming in Phase 2</p>
      <p className="mt-1 text-xs text-neutral-600">workspace: {workspaceId}</p>
    </div>
  );
}
