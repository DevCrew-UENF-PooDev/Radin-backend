import { Server, Socket } from "socket.io";
import supabase from "../lib/supabaseClient";
import { decryptMessage, encryptMessage } from "../utils/crypto";
// import { encryptMessage } from "../utils/crypto";

export const handleMessages = (socket: Socket, io: Server) => {
  const userId = socket.handshake.query.userId;

  socket.on('joinChat', (chatId: string) => socket.join(`chat:${chatId}`));
  socket.on('leaveChat', (chatId: string) => socket.leave(`chat:${chatId}`));

  // Cliente envia a mensagem
  socket.on('sendMessage', async ({ chatId, text, tempMessageId }) => {
    // 1. insere a mensagem com tick 'sent'
    const encryptedText = encryptMessage(text);//text;//encryptMessage(text);
    const { data: msg, error: msgErr } = await supabase
      .from('messages')
      .insert([{ chat_id: chatId, sender_id: userId, text: encryptedText, tick: 'sent' }])
      .select()
      .single();
    if (msgErr) return console.error(msgErr);

    // 2. pega os destinatários (todos menos o sender)
    const { data: members } = await supabase
      .from('chat_members')
      .select('user_id')
      .neq('user_id', userId)
      .eq('chat_id', chatId);
    if(members) {
      const recipients = members.map(m => m.user_id);

      // 3. Cria a tabela para os destinários
      const statusRows = recipients.flatMap(user_id => ({
        message_id: msg.id,
        user_id
      }));
      const { error: statusErr } = await supabase
        .from('message_status')
        .insert(statusRows);
      if (statusErr) return console.error(statusErr);
      
      msg.text = decryptMessage(msg.text);
      // 4. emite a nova mensagem e o tick 'sent'
      io.to(`chat:${chatId}`).emit('newMessage', {msg, tempMessageId});
      io.to(`user:${userId}`).emit('tickUpdated', { msg, tick: 'sent', tempMessageId });
    }
  });

  // Usuário recebe a mensagem
  socket.on('messageDelivered', async ({ messageId }) => {
    // atualiza delivered_at
    await supabase
      .from('message_status')
      .update({ delivered_at: new Date().toISOString() })
      .match({ message_id: messageId, user_id: userId });

    // conta quantos confirmaram delivered
    const { count: deliveredCount } = await supabase
      .from('message_status')
      .select('user_id', { count: 'exact' })
      .eq('message_id', messageId)
      .not('delivered_at', 'is', null);

    // conta total de recipients
    const { count: totalCount } = await supabase
      .from('message_status')
      .select('user_id', { count: 'exact' })
      .eq('message_id', messageId);

    // se todo mundo recebeu, marca o tick na messages e emite
    if (deliveredCount === totalCount) {
      const { error: err, data: m } = await supabase
        .from('messages')
        .update({ tick: 'delivered' })
        .eq('id', messageId).select().single();
      if(err) return console.error(err);
      m.text = decryptMessage(m.text);
      io.to(`user:${m.sender_id}`).emit('tickUpdated', { msg: m, tick: 'delivered', tempMessageId: '' });
    }
  });

  // Cliente leu a mensagem
  socket.on('messageRead', async ({ messageId }) => {
    await supabase.rpc('update_message_status_timestamps', {
      msg_id: messageId,
      usr_id: userId,
      now: new Date().toISOString()
    });

    // conta quantos confirmaram read
    const { count: readCount } = await supabase
      .from('message_status')
      .select('user_id', { count: 'exact' })
      .eq('message_id', messageId)
      .not('read_at', 'is', null);
      
    const { count: totalCount } = await supabase
      .from('message_status')
      .select('user_id', { count: 'exact' })
      .eq('message_id', messageId);
      
    // se todo mundo leu, marca o tick e emite
    if (readCount === totalCount) {
      const { error: err, data: m } = await supabase
        .from('messages')
        .update({ tick: 'read' })
        .eq('id', messageId).select().single();
      if(err) return console.error(err);
      m.text = decryptMessage(m.text);
      io.to(`user:${m.sender_id}`).emit('tickUpdated', { msg: m, tick: 'read', tempMessageId: '' });
    }
  });
  
};
