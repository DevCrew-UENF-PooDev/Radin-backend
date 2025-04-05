import { Request, Response } from 'express';

import supabase from '../lib/supabaseClient';
import { getOnlineStatus } from '../utils/status';
import { enrichChat } from '../utils/enrichChat';


export const listUserChats = async (req: Request, res: Response) => {
  try {
    const userId = req.user.sub;
    if (!userId) return res.status(401).json({ error: "Usuário não autenticado" });

    const { data: memberships, error: membershipError } = await supabase
      .from("chat_members")
      .select("chat_id")
      .eq("user_id", userId);
    if (membershipError) throw membershipError;

    const chatIds = memberships?.map((m: any) => m.chat_id);
    if (!chatIds || chatIds.length === 0) return res.status(200).json({ chats: [] });

    const { data: chatsData, error: chatsError } = await supabase
      .from("chats")
      .select("*")
      .in("id", chatIds)
      .order("updated_at", { ascending: false });
    if (chatsError) throw chatsError;

    // Monta os chats com membros e última mensagem
    const chats = await Promise.all((chatsData || []).map(async (chat: any) => {
      // Membros do chat
      const { data: membersData, error: membersError } = await supabase
        .from("chat_members")
        .select(`
          user_id,
          profiles ( id, username, artwork, socket_updated_at )
        `)
        .neq('user_id', userId)
        .eq("chat_id", chat.id);
      if (membersError) throw membersError;

      const members = (membersData || []).map((memberWrapper: any) => {
        const profile = memberWrapper.profiles;
        return {
          id: profile.id,
          username: profile.username,
          artwork: profile.artwork,
          status: getOnlineStatus(profile.socket_updated_at)
        };
      });

      const { data: lastMessageData, error: messageError } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: true });
      if (messageError) throw messageError;

      return {
        ...chat,
        members,
        messages: lastMessageData || []
      };
    }));

    return res.status(200).json({ chats });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro ao listar chats" });
  }
};

export const createPrivateChat = async (req: Request, res: Response) => {
  try {
    const userId = req.user.sub;
    const { targetUserId } = req.body;

    if (!userId || !targetUserId || userId === targetUserId) 
      return res.status(400).json({ error: "Dados inválidos" });

    const { data: existingChats, error: findError } = await supabase
      .from("chat_members")
      .select("chat_id")
      .in("user_id", [userId, targetUserId]);

    if (findError) throw findError;

    const chatCountMap: Record<string, number> = {};
    for (const row of existingChats || []) 
      chatCountMap[row.chat_id] = (chatCountMap[row.chat_id] || 0) + 1;
    
    const matchedChatId = Object.entries(chatCountMap).find(([_, count]) => count === 2)?.[0];

    if (matchedChatId) {
      const { data: existingChat, error: chatError } = await supabase
        .from("chats")
        .select("*")
        .eq("id", matchedChatId)
        .eq("is_group", false)
        .single();

      if (chatError) throw chatError;

      const chat = await enrichChat(existingChat, userId);
      return res.status(200).json({ chat });
    }

    const { data: newChat, error: createError } = await supabase
      .from("chats")
      .insert([{ is_group: false, name: '' }])
      .select()
      .single();

    if (createError) throw createError;

    const { error: memberError } = await supabase
      .from("chat_members")
      .insert([
        { chat_id: newChat.id, user_id: userId },
        { chat_id: newChat.id, user_id: targetUserId },
      ]);

    if (memberError) throw memberError;

    const chat = await enrichChat(newChat, userId);
    return res.status(201).json({ chat });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao criar chat privado" });
  }
};
