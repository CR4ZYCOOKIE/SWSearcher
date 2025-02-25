const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  console.log('Function called');
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: 'Function is working',
      time: new Date().toISOString()
    })
  };
}; 