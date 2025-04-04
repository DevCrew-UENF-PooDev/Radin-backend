import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const userId = req.user.sub;
    if (!userId) return res.status(401).json({ error: "Usuário não autenticado" });
    if (!q) return res.status(400).json({ error: "Query vazia" });

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, artwork")
      .ilike("username", `%${q}%`)
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
      .select("id, username, artwork")
      .order("username", { ascending: true })
      .range(offset, offset + pageSize - 1)
      .neq("id", userId);

    if (error) throw error;

    res.status(200).json({ page: pageNumber, limit: pageSize, users: data });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
};
  
  