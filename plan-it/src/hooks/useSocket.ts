'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(projectId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    const socketInstance = io({
      path: '/api/socket',
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      if (projectId) {
        socketInstance.emit('join:project', projectId);
      }
    });

    setSocket(socketInstance);

    return () => {
      if (projectId) {
        socketInstance.emit('leave:project', projectId);
      }
      socketInstance.disconnect();
    };
  }, [projectId]);

  return socket;
}
