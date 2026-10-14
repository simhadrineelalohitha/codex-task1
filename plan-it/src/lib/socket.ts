import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token?: string): Socket {
  if (!socket) {
    socket = io({
      path: '/api/socket',
      auth: { token: token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null) },
      autoConnect: false,
    });
  }
  return socket;
}
