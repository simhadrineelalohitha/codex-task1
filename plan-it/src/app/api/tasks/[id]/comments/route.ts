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
    const { id: taskId } = resolvedParams;

    const comments = await prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error('Comments fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: taskId } = resolvedParams;
    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: true,
        assignee: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        authorId: session.userId,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Notify task assignee if someone else comments on their task
    if (task.assigneeId && task.assigneeId !== session.userId) {
      await prisma.notification.create({
        data: {
          userId: task.assigneeId,
          actorId: session.userId,
          type: 'COMMENT_ADDED',
          message: `${session.name} commented on "${task.title}"`,
          link: `/projects/${task.column.projectId}?taskId=${task.id}`,
        },
      });

      const io = (global as any).io;
      if (io) {
        io.to(`user:${task.assigneeId}`).emit('notification:new', {
          message: `${session.name} commented on "${task.title}"`,
        });
      }
    }

    // Broadcast comment:created to project room
    const io = (global as any).io;
    if (io) {
      io.to(`project:${task.column.projectId}`).emit('comment:created', {
        taskId,
        comment,
      });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: any) {
    console.error('Comment create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
