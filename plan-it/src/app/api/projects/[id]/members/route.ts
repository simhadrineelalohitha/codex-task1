import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

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
    const { id: projectId } = resolvedParams;
    const { email, role = 'MEMBER' } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const currentMember = project.members.find((m) => m.userId === session.userId);
    const isAdmin = project.ownerId === session.userId || currentMember?.role === 'ADMIN';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only Admins can invite team members' }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User with this email not found. Make sure they registered.' }, { status: 404 });
    }

    const membership = await prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId, userId: targetUser.id },
      },
      update: { role },
      create: {
        projectId,
        userId: targetUser.id,
        role,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ member: membership });
  } catch (error: any) {
    console.error('Member invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
