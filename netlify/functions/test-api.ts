import { Handler } from '@netlify/functions';

const STEAM_USER_API = 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/';

const handler: Handler = async () => {
  try {
    const apiKey = process.env.VITE_STEAM_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Steam API key is not configured' })
      };
    }

    const params = new URLSearchParams({
      key: apiKey,
      steamids: '76561197960435530'
    });

    const response = await fetch(`${STEAM_USER_API}?${params.toString()}`);
    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'API key is valid and working',
        data
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to test Steam API key' })
    };
  }
};

export { handler }; 