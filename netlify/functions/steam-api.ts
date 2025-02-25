import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';
import type { Response } from 'node-fetch';

const STEAM_API_BASE = 'https://api.steampowered.com/ISteamUGC/GetQueryUGCResults/v1/';

const handler: Handler = async (event) => {
  try {
    // Log incoming request
    console.log('Request body:', event.body);

    const { query, appId } = JSON.parse(event.body || '{}');
    const apiKey = process.env.VITE_STEAM_API_KEY;

    if (!apiKey) {
      console.error('Steam API key not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Steam API key is not configured' })
      };
    }

    console.log('Making request to Steam API with query:', query);

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

    const steamUrl = `${STEAM_API_BASE}?${params.toString()}`;
    console.log('Steam API URL:', steamUrl);

    const response = await fetch(steamUrl);
    
    if (!response.ok) {
      console.error('Steam API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Steam API error response:', errorText);
      
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: 'Steam API request failed',
          details: errorText
        })
      };
    }

    const data = await response.json();
    console.log('Steam API response:', JSON.stringify(data, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to fetch workshop items',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

export { handler }; 