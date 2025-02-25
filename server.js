import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Import the search handler dynamically
const searchModule = await import('./functions/search.js');
const searchHandler = searchModule.handler;

// Simulate Netlify Functions environment
app.post('/.netlify/functions/search', async (req, res) => {
  try {
    const result = await searchHandler({
      httpMethod: 'POST',
      body: JSON.stringify(req.body),
      headers: req.headers,
      // Pass environment variables
      env: {
        VITE_STEAM_API_KEY: process.env.VITE_STEAM_API_KEY
      }
    });
    
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 9999;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Environment:', {
    hasApiKey: !!process.env.VITE_STEAM_API_KEY,
    nodeEnv: process.env.NODE_ENV
  });
}); 