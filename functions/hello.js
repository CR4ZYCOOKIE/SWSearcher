module.exports = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Hello from Netlify function!',
      time: new Date().toISOString()
    })
  };
}; 