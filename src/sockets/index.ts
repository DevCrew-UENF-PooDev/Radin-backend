import { Server } from "socket.io";
import { handlePresence } from "./presence.socket";
import { handleMessages } from "./messages.socket";
import dotenv from 'dotenv';

dotenv.config();

const origin = process.env.ORIGIN || 'http://localhost:9000';

export const initSocket = (server: any) => {
  const io = new Server(server, {
    cors: { origin: origin, methods: ["GET", "POST"]}
  });

  io.on("connection", socket => {
    if(!socket.handshake.query.userId) {
      socket.disconnect();
      return;
    }
    socket.join(`user:${socket.handshake.query.userId}`); // Sala pessoal do usuário
    handlePresence(socket, io);
    handleMessages(socket, io);
  });

  return io;
};
