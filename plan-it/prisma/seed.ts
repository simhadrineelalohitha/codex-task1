import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SQLite database...');

  // Clean old entries if any
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.boardColumn.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Demo1234!', 10);

  // 1. Create Users
  const sarah = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'demo@taskpulse.io',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const alex = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'alex@taskpulse.io',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const maya = await prisma.user.create({
    data: {
      name: 'Maya Lin',
      email: 'maya@taskpulse.io',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  // 2. Create Demo Project
  const project = await prisma.project.create({
    data: {
      title: 'TaskPulse Enterprise Platform',
      description: 'Collaborative next-gen agile project management board with real-time updates and notification sync.',
      ownerId: sarah.id,
      members: {
        create: [
          { userId: sarah.id, role: 'ADMIN' },
          { userId: alex.id, role: 'MEMBER' },
          { userId: maya.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // 3. Create Columns
  const colTodo = await prisma.boardColumn.create({
    data: { title: 'To Do', orderIndex: 0, projectId: project.id },
  });
  const colProgress = await prisma.boardColumn.create({
    data: { title: 'In Progress', orderIndex: 1, projectId: project.id },
  });
  const colReview = await prisma.boardColumn.create({
    data: { title: 'In Review', orderIndex: 2, projectId: project.id },
  });
  const colDone = await prisma.boardColumn.create({
    data: { title: 'Done', orderIndex: 3, projectId: project.id },
  });

  // 4. Create Tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Architect Real-Time WebSocket Rooms',
      description: 'Configure Socket.IO room subscriptions scoped to project IDs for immediate state synchronization across tabs.',
      priority: 'URGENT',
      columnId: colProgress.id,
      creatorId: sarah.id,
      assigneeId: alex.id,
      orderIndex: 0,
      dueDate: new Date(Date.now() + 86400000 * 2),
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Build Drag-and-Drop Task Board',
      description: 'Implement optimistic UI updates with smooth animations and rollback protection on network failure.',
      priority: 'HIGH',
      columnId: colProgress.id,
      creatorId: sarah.id,
      assigneeId: sarah.id,
      orderIndex: 1,
      dueDate: new Date(Date.now() + 86400000 * 4),
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Design Linear-style Dark Dashboard',
      description: 'Craft high-contrast minimal UI components with Lucide icons, keyboard shortcuts, and responsive layouts.',
      priority: 'MEDIUM',
      columnId: colDone.id,
      creatorId: sarah.id,
      assigneeId: maya.id,
      orderIndex: 0,
      dueDate: new Date(Date.now() - 86400000), // Overdue
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'JWT Token Refresh & Cookie Security',
      description: 'Implement secure HTTP-only cookies and Authorization header fallback for API and WebSocket handshakes.',
      priority: 'HIGH',
      columnId: colReview.id,
      creatorId: sarah.id,
      assigneeId: alex.id,
      orderIndex: 0,
      dueDate: new Date(Date.now() + 86400000 * 5),
    },
  });

  const task5 = await prisma.task.create({
    data: {
      title: 'Notification Bell & Live Unread Badges',
      description: 'Trigger notifications when members are assigned to cards or tagged in comment threads.',
      priority: 'LOW',
      columnId: colTodo.id,
      creatorId: sarah.id,
      assigneeId: maya.id,
      orderIndex: 0,
      dueDate: new Date(Date.now() + 86400000 * 7),
    },
  });

  // 5. Create Comments
  await prisma.comment.create({
    data: {
      taskId: task1.id,
      authorId: sarah.id,
      content: 'Make sure the socket server checks the user JWT before approving the room join request.',
    },
  });

  await prisma.comment.create({
    data: {
      taskId: task1.id,
      authorId: alex.id,
      content: 'Added the handshake auth middleware in the custom server. Testing reconnection resilience.',
    },
  });

  await prisma.comment.create({
    data: {
      taskId: task2.id,
      authorId: maya.id,
      content: 'The drag interactions look super smooth! Testing on tablet screens now.',
    },
  });

  // 6. Create Notifications
  await prisma.notification.create({
    data: {
      userId: sarah.id,
      actorId: alex.id,
      type: 'COMMENT_ADDED',
      message: 'Alex Rivera commented on "Architect Real-Time WebSocket Rooms"',
      link: `/projects/${project.id}?taskId=${task1.id}`,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: sarah.id,
      actorId: maya.id,
      type: 'TASK_MOVED',
      message: 'Maya Lin moved "Design Linear-style Dark Dashboard" to Done',
      link: `/projects/${project.id}?taskId=${task3.id}`,
      isRead: false,
    },
  });

  console.log('✅ SQLite database seeded successfully!');
  console.log('Demo Credentials: demo@taskpulse.io / Demo1234!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
