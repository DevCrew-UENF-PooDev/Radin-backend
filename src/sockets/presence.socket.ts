import { Server, Socket } from "socket.io";
import supabase from "../lib/supabaseClient";

export const handlePresence = (socket: Socket, io: Server) => {
  const userId = socket.handshake.query.userId as string;
  console.log("Socket conectado:", socket.id);

  supabase
    .from("profiles")
    .update({ socket_id: socket.id, socket_updated_at: new Date().toISOString() })
    .eq("id", userId)
    .then(({ error }) => {
      if (error) console.error("Erro ao atualizar presença:", error);
    }
  );

  io.emit('user:online', { userId });

  socket.on("disconnect", () => {
    console.log("Socket desconectado:", socket.id);
    supabase
      .from("profiles")
      .update({ socket_id: null, socket_updated_at: new Date().toISOString() })
      .eq("id", userId)
      .then(({ error }) => {
        if (error) console.error("Erro ao limpar presença:", error);
      }
    );
    io.emit('user:offline', { userId });
  });
};
