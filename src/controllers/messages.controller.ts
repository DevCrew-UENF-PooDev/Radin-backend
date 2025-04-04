import { Request, Response } from 'express';
import { encryptMessage } from '../utils/crypto';
import supabase from '../lib/supabaseClient';

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { text, chatId } = req.body;
    const senderId = req.user.sub;
    const encryptedText = encryptMessage(text);
    const { data, error } = await supabase
      .from('messages')
      .insert([{ text: encryptedText, sender_id: senderId, chat_id: chatId }]);
    
    if (error) return res.status(500).json({ error: error.message });
    
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
