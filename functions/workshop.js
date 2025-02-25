const fetch = require('node-fetch');

exports.handler = async function(event) {
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    console.log('Function called with body:', event.body);
    
    const { query } = JSON.parse(event.body || '{}');
    const apiKey = process.env.VITE_STEAM_API_KEY;

    if (!apiKey) {
      console.error('API key missing');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Steam API key not configured' })
      };
    }

    const params = new URLSearchParams({
      key: apiKey,
      appid: '221100',
      query_type: '1',
      search_text: query || '',
      numperpage: '10',
      return_tags: 'true',
      return_details: 'true',
      return_metadata: 'true',
      format: 'json'
    });

    console.log('Making request to Steam API...');
    const response = await fetch(
      `https://api.steampowered.com/ISteamUGC/GetQueryUGCResults/v1/?${params}`
    );

    if (!response.ok) {
      console.error('Steam API error:', response.status);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `Steam API returned ${response.status}` })
      };
    }

    const data = await response.json();
    console.log('Steam API response received');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}; 