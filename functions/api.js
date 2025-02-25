const fetch = require('node-fetch');

exports.handler = async function(event) {
  // Log the event details
  console.log('Function called:', {
    method: event.httpMethod,
    path: event.path,
    body: event.body,
    env: {
      hasApiKey: !!process.env.VITE_STEAM_API_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  });

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { 
      statusCode: 200, 
      headers,
      body: JSON.stringify({ message: 'OK' })
    };
  }

  try {
    // Parse request body
    let requestBody = null;
    try {
      requestBody = event.body ? JSON.parse(event.body) : null;
      console.log('Parsed request body:', requestBody);
    } catch (e) {
      console.error('Error parsing request body:', e);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    // Check API key
    if (!process.env.VITE_STEAM_API_KEY) {
      console.error('API key missing');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Steam API key not configured',
          env: process.env.NODE_ENV,
          keys: Object.keys(process.env)
        })
      };
    }

    // Return test response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'API is working',
        time: new Date().toISOString(),
        hasApiKey: true,
        requestBody,
        method: event.httpMethod
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        type: error.constructor.name
      })
    };
  }
}; 