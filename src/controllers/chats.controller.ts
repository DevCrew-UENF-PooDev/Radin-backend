import { Request, Response } from 'express';

import supabase from '../lib/supabaseClient';

export const listUserChats = async (req: Request, res: Response) => {
    try {
      const userId = req.user.sub;
      if (!userId) return res.status(401).json({ error: "Usuário não autenticado" });
  
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .contains("members", [userId]);
  
      if (error) throw error;
  
      res.status(200).json({ chats: data });
    } catch (error) {
      res.status(500).json({ error: "Erro ao listar chats" });
    }
  };
  