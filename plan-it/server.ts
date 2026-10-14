import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Attach to global for Next.js route handler access
  (global as any).io = io;

  io.on('connection', (socket) => {
    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> TaskPulse live preview ready on http://${hostname}:${port}`);
  });
});
