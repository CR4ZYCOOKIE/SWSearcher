import fetch from 'node-fetch';

export async function handler(event) {
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

    // Log the raw vote data for debugging
    if (data.response?.publishedfiledetails) {
      data.response.publishedfiledetails.forEach(item => {
        console.log(`Item ${item.publishedfileid} vote data:`, item.vote_data);
      });
    }

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
}

function processWorkshopData(data) {
    // ... existing code ...

    // Find where we process the rating
    const rating = item.vote_data ? {
        score: parseFloat(item.vote_data.score) || 0,
        votes: parseInt(item.vote_data.votes) || 0
    } : {
        score: 0,
        votes: 0
    };

    // Convert score to 5-star scale and handle edge cases
    const fiveStarRating = rating.votes > 0 ? (rating.score * 5) : 0;

    return {
        // ... other properties ...
        rating: {
            score: Math.round(fiveStarRating * 10) / 10, // Round to 1 decimal place
            votes: rating.votes
        }
    };
} 