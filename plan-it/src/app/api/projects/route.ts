import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: session.userId },
          { members: { some: { userId: session.userId } } },
        ],
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        columns: {
          select: { id: true, _count: { select: { tasks: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error('Projects fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, memberEmails } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Project title is required' }, { status: 400 });
    }

    // Create project with default Kanban columns
    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        ownerId: session.userId,
        members: {
          create: [{ userId: session.userId, role: 'ADMIN' }],
        },
        columns: {
          create: [
            { title: 'To Do', orderIndex: 0 },
            { title: 'In Progress', orderIndex: 1 },
            { title: 'In Review', orderIndex: 2 },
            { title: 'Done', orderIndex: 3 },
          ],
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        columns: true,
      },
    });

    // Invite team members by email if specified
    if (Array.isArray(memberEmails) && memberEmails.length > 0) {
      for (const email of memberEmails) {
        if (!email) continue;
        const targetUser = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        });

        if (targetUser && targetUser.id !== session.userId) {
          await prisma.projectMember.upsert({
            where: {
              projectId_userId: { projectId: project.id, userId: targetUser.id },
            },
            update: {},
            create: {
              projectId: project.id,
              userId: targetUser.id,
              role: 'MEMBER',
            },
          });
        }
      }
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    console.error('Project create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
