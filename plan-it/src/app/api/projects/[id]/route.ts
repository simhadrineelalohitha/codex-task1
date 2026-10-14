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

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        columns: {
          orderBy: { orderIndex: 'asc' },
          include: {
            tasks: {
              orderBy: { orderIndex: 'asc' },
              include: {
                assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
                _count: { select: { comments: true } },
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check membership
    const isOwner = project.ownerId === session.userId;
    const isMember = project.members.some((m) => m.userId === session.userId);

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error('Project details fetch error:', error);
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
    const project = await prisma.project.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Role check: Only Owner or ADMIN can delete
    const memberRole = project.members.find((m) => m.userId === session.userId)?.role;
    const canDelete = project.ownerId === session.userId || memberRole === 'ADMIN';

    if (!canDelete) {
      return NextResponse.json({ error: 'Only Project Owners or Admins can delete projects.' }, { status: 403 });
    }

    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Project deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
