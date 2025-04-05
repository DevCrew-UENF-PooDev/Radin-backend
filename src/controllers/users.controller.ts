import { Request, Response } from 'express';
import supabase from '../lib/supabaseClient';
import { getOnlineStatus } from '../utils/status';

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const userId = req.user.sub;
    if (!userId) return res.status(401).json({ error: "Usuário não autenticado" });
    if (!query) return res.status(400).json({ error: "Query vazia" });

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, artwork")
      .ilike("username", `%${query}%`)
      .neq("id", userId);

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    let { page, limit } = req.query;

    const userId = req.user.sub;
    if (!userId) return res.status(401).json({ error: "Usuário não autenticado" });

    const pageNumber = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 10;
    const offset = (pageNumber - 1) * pageSize;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, artwork, socket_updated_at")
      .order("username", { ascending: true })
      .range(offset, offset + pageSize - 1)
      .neq("id", userId);

    if (error) return res.status(401).json({ error: error.message });

    const users = (data || []).map((profile) => ({
      id: profile.id,
      username: profile.username,
      artwork: profile.artwork,
      status: getOnlineStatus(profile.socket_updated_at)
    }));


    res.status(200).json({ page: pageNumber, limit: pageSize, users: users });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
};
  
  