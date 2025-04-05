import { Server } from "socket.io";
import { handlePresence } from "./presence.socket";
import { handleMessages } from "./messages.socket";

export const initSocket = (server: any) => {
  const io = new Server(server, {
    cors: { origin: 'http://localhost:9000', methods: ["GET", "POST"]}
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
