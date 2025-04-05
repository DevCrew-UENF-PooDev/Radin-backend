import supabase from '../lib/supabaseClient';
import { getOnlineStatus } from "./status";

export const enrichChat = async (chat: any, userId: string) => {
  const { data: membersData, error: membersError } = await supabase
    .from("chat_members")
    .select(`
      user_id,
      profiles ( id, username, artwork, socket_updated_at )
    `)
    .neq('user_id', userId)
    .eq("chat_id", chat.id);
  if (membersError) throw membersError;

  const members = (membersData || []).map((m: any) => {
    const profile = m.profiles;
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
    .order("created_at", { ascending: false })
    .limit(1);
  if (messageError) throw messageError;

  return {
    ...chat,
    members,
    messages: lastMessageData || []
  };
};
