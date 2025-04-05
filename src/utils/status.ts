export const getOnlineStatus = (lastLogin: string | null): string => {
  if (!lastLogin) return "Offline";
  
  const last = new Date(lastLogin);
  const now = new Date();
  const diffMs = now.getTime() - last.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 5) return "Online";
  
  if (diffMinutes < 60) return `Offline há ${diffMinutes} minuto(s)`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Offline há ${diffHours} hora(s)`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `Offline há ${diffDays} dia(s)`;
};
  