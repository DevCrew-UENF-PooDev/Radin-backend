import { Request, Response } from 'express';
import supabase from '../lib/supabaseClient';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: error.message });
  
  const accessToken = data.session.access_token;

  res.cookie('access_token', accessToken, {
    httpOnly: true,         // Acessível apenas pelo servidor, protegendo contra XSS
    secure: process.env.NODE_ENV === "production",  // (HTTPS obrigatório)
    sameSite: 'lax',        // Pode ajustar conforme necessário (lax, strict ou none)
    maxAge: 1000 * 60 * 60,   // 1 hora de validade
  });

  res.status(200).json({
    message: "Login realizado!",
    user: data.user,
    access_token: accessToken,
    refresh_token: data.session.refresh_token
  });
};

export const register = async (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  const { data: existingUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username);

  if (existingUser && existingUser.length > 0) 
    return res.status(400).json({ error: "Username já em uso." });

  const { data, error } = await supabase.auth.signUp({ email, password });
  if(error) return res.status(400).json({ error: error.message});
  if(!data.user) return res.status(401).json({ error: "Erro ao criar usuário"});

  const {error: insertError } = await supabase.from("profiles").insert([{
    id: data.user.id,
    username
  }]);

  if (insertError) {
    await supabase.auth.admin.deleteUser(data.user.id);
    return res.status(500).json({ error: "Erro ao criar perfil do usuário" });
  }

  res.status(201).json({message: "Usuário criado! Verifique o email"});
};

export const profile = async (req: Request, res: Response) => {
  try {
    const userId = req.user.sub;
    if (!userId) return res.status(401).json({ error: "Usuário não autenticado" });
    
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ user: data });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar informações do usuário" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const accessToken = req.cookies?.access_token;

    if (accessToken) await supabase.auth.signOut();
    
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({ message: "Logout realizado com sucesso!" });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao realizar logout." });
  }
};
