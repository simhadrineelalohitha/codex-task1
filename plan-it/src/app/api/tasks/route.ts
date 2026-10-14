import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { columnId, title, description, priority = 'MEDIUM', dueDate, assigneeId } = await req.json();

    if (!columnId || !title || !title.trim()) {
      return NextResponse.json({ error: 'Column ID and title are required' }, { status: 400 });
    }

    const column = await prisma.boardColumn.findUnique({
      where: { id: columnId },
      include: {
        project: { include: { members: true } },
        tasks: { orderBy: { orderIndex: 'desc' }, take: 1 },
      },
    });

    if (!column) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 });
    }

    // Next orderIndex
    const nextOrder = column.tasks.length > 0 ? column.tasks[0].orderIndex + 1 : 0;

    const task = await prisma.task.create({
      data: {
        columnId,
        title: title.trim(),
        description: description?.trim() || null,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        orderIndex: nextOrder,
        creatorId: session.userId,
        assigneeId: assigneeId || null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        _count: { select: { comments: true } },
      },
    });

    // If assigned to another user, create a notification
    if (assigneeId && assigneeId !== session.userId) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          actorId: session.userId,
          type: 'TASK_ASSIGNED',
          message: `${session.name} assigned you to "${task.title}"`,
          link: `/projects/${column.projectId}?taskId=${task.id}`,
        },
      });

      // Dispatch to real-time notification socket if connected
      const io = (global as any).io;
      if (io) {
        io.to(`user:${assigneeId}`).emit('notification:new', {
          message: `${session.name} assigned you to "${task.title}"`,
        });
      }
    }

    // Broadcast real-time task:created to the project room
    const io = (global as any).io;
    if (io) {
      io.to(`project:${column.projectId}`).emit('task:created', task);
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    console.error('Task create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
