import { KanbanBoardView } from '@/components/board/KanbanBoardView';

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KanbanBoardView projectId={id} />;
}
