export function getSteamApiKey(): string {
  // Try different ways to get the API key
  return (
    import.meta.env.VITE_STEAM_API_KEY || 
    window.ENV?.VITE_STEAM_API_KEY || 
    ''
  );
} 