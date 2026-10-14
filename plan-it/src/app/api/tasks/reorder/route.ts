import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, targetColumnId, newIndex, projectId } = await req.json();

    if (!taskId || !targetColumnId || typeof newIndex !== 'number') {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Fetch current task
    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: true,
        assignee: { select: { id: true, name: true } },
      },
    });

    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const oldColumnId = currentTask.columnId;

    // 2. Fetch destination tasks sorted by orderIndex
    const destTasks = await prisma.task.findMany({
      where: { columnId: targetColumnId },
      orderBy: { orderIndex: 'asc' },
    });

    // Remove current task if moving within same column
    const filteredDestTasks = destTasks.filter((t) => t.id !== taskId);

    // Insert task into newIndex
    filteredDestTasks.splice(newIndex, 0, currentTask);

    // Batch update orderIndex in a transaction
    await prisma.$transaction(
      filteredDestTasks.map((task, idx) =>
        prisma.task.update({
          where: { id: task.id },
          data: {
            orderIndex: idx,
            columnId: targetColumnId,
          },
        })
      )
    );

    // If task moved to a different column, create notification for assignee if exists
    if (oldColumnId !== targetColumnId && currentTask.assigneeId && currentTask.assigneeId !== session.userId) {
      const destColumn = await prisma.boardColumn.findUnique({ where: { id: targetColumnId } });
      if (destColumn) {
        await prisma.notification.create({
          data: {
            userId: currentTask.assigneeId,
            actorId: session.userId,
            type: 'TASK_MOVED',
            message: `${session.name} moved "${currentTask.title}" to ${destColumn.title}`,
            link: `/projects/${projectId}?taskId=${currentTask.id}`,
          },
        });
      }
    }

    // Real-time broadcast
    const io = (global as any).io;
    if (io && projectId) {
      io.to(`project:${projectId}`).emit('task:reordered', {
        taskId,
        sourceColId: oldColumnId,
        targetColId: targetColumnId,
        newIndex,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Task reorder error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
