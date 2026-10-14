import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        column: { select: { id: true, title: true, projectId: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error('Task fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();
    const { title, description, priority, dueDate, assigneeId, columnId } = body;

    const currentTask = await prisma.task.findUnique({
      where: { id },
      include: { column: true },
    });

    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(columnId !== undefined && { columnId }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        _count: { select: { comments: true } },
      },
    });

    // Notify new assignee if changed
    if (assigneeId && assigneeId !== currentTask.assigneeId && assigneeId !== session.userId) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          actorId: session.userId,
          type: 'TASK_ASSIGNED',
          message: `${session.name} assigned you to "${updatedTask.title}"`,
          link: `/projects/${currentTask.column.projectId}?taskId=${updatedTask.id}`,
        },
      });
    }

    // Real-time broadcast
    const io = (global as any).io;
    if (io) {
      io.to(`project:${currentTask.column.projectId}`).emit('task:updated', updatedTask);
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error: any) {
    console.error('Task update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const task = await prisma.task.findUnique({
      where: { id },
      include: { column: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });

    const io = (global as any).io;
    if (io) {
      io.to(`project:${task.column.projectId}`).emit('task:deleted', { taskId: id, columnId: task.columnId });
    }

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('Task delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
