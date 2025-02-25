import { Handler } from '@netlify/functions';

const STEAM_API_BASE = 'https://api.steampowered.com/ISteamUGC/GetQueryUGCResults/v1/';

const handler: Handler = async (event) => {
  try {
    const { query, appId } = JSON.parse(event.body || '{}');
    const apiKey = process.env.VITE_STEAM_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Steam API key is not configured' })
      };
    }

    const params = new URLSearchParams({
      key: apiKey,
      appid: appId || '221100',
      query_type: '1',
      search_text: query || '',
      numperpage: '10',
      cursor: '*',
      sort_order: '0',
      return_tags: 'true',
      return_details: 'true',
      return_metadata: 'true',
      return_previews: 'true',
      language: '0',
      format: 'json'
    });

    const response = await fetch(`${STEAM_API_BASE}?${params.toString()}`);
    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch workshop items' })
    };
  }
};

export { handler }; 