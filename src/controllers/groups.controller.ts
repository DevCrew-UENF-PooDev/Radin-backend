import { Request, Response } from 'express';
import supabase from '../lib/supabaseClient';

export const listAllGroups = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("chats")
      // .select("id, name, artwork")
      .select("id, name, artwork, description, created_at, chat_members(user_id, profiles(username, artwork))")
      .eq("is_group", true)
      .order("created_at", { ascending: true });

    if (error) return res.status(500).json({ error: "Erro ao buscar grupos" });

    const groups = (data || []).map((group: any) => ({
      id: group.id,
      name: group.name,
      artwork: group.artwork,
      description: group.description,
      created_at: group.created_at,
      members: (group.chat_members || []).map((member: any) => ({
        id: member.user_id,
        username: member.profiles?.username ?? null,
        artwork: member.profiles?.artwork ?? null,
      })),
    }));

    res.status(200).json({ groups: groups });
  } catch (err) {
    res.status(500).json({ error: "Erro interno no servidor" });
  }
};

export const createGroup = async (req: Request, res: Response) => {
  const userId = req.user.sub;
  if (!userId) return res.status(401).json({ error: "Usuário não autenticado" });
  const { name, description } = req.body;

  if (!name) return res.status(400).json({ error: "Nome do grupo é obrigatório" });

  const { data: chat, error } = await supabase
    .from("chats")
    .insert([{ name, description, is_group: true }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: "Error ao criar o grupo" });

  const { error: memberError } = await supabase
    .from("chat_members")
    .insert([{ chat_id: chat.id, user_id: userId }]);

  if (memberError) return res.status(500).json({ error: "Grupo criado, mas falha ao entrar" });
  
  res.status(201).json({ group: chat, message: "Grupo criado com sucesso!" });
}

type MemberWithProfile = {
  user_id: string;
  profiles: {
    username: string;
    artwork: string | null;
  } | null;
};
  

export const getGroupMembers = async (req: Request, res: Response) => {
  const userId = req.user.sub;
  if (!userId) return res.status(401).json({ error: "Usuário não autenticado" });
  const groupId = req.params.id;
  const { data, error } = await supabase
    .from("chat_members")
    .select("user_id, profiles(username, artwork)")
    .eq("chat_id", groupId);
  if (error) return res.status(500).json({ error: "Erro ao visualizar os membros" });

  const members = (data as unknown as MemberWithProfile[]).map((m) => ({
    id: m.user_id,
    username: m.profiles?.username,
    artwork: m.profiles?.artwork,
  }));
  
  res.json({ members });   
}

export const joinInGroup = async (req: Request, res: Response) => {
  const userId = req.user.sub;
  if (!userId) return res.status(401).json({ error: "Usuário não autenticado" });
  const groupId = req.params.id;

  const { data: existing } = await supabase
    .from("chat_members")
    .select("chat_id")
    .eq("chat_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return res.status(200).json({ message: "Você já é membro" });

  const { error } = await supabase
  .from("chat_members")
  .insert([{ chat_id: groupId, user_id: userId }]);

  if (error) return res.status(500).json({ error: "Falha ao entrar no grupo" });
  
  res.status(200).json({ message: "Você entrou no grupo com sucesso!" });
}