import type { WorkshopItem } from '../types';

const STEAM_API_BASE = 'https://api.steampowered.com/ISteamUGC/GetQueryUGCResults/v1/';
const STEAM_USER_API_BASE = 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/';

export async function testSteamApiKey(): Promise<void> {
  try {
    const response = await fetch('/.netlify/functions/test-api', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API Test Results:', data);

  } catch (error) {
    console.error('❌ Error testing API key:', error);
  }
}

export async function searchWorkshop(query: string, appId: string): Promise<WorkshopItem[]> {
  try {
    const response = await fetch('/.netlify/functions/steam-api', {
      method: 'POST',
      body: JSON.stringify({ query, appId })
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data?.response?.publishedfiledetails) {
      throw new Error('Invalid response from API');
    }

    return data.response.publishedfiledetails.map((item: any) => ({
      id: item.publishedfileid,
      title: item.title || 'Untitled',
      description: item.description || 'No description available',
      author: item.creator || 'Unknown',
      thumbnailUrl: item.preview_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80',
      rating: parseFloat(((item.vote_data?.score || 0) * 5).toFixed(1)) || 5,
      downloads: parseInt(item.subscriptions || '0', 10),
      lastUpdated: new Date(parseInt(item.time_updated || Date.now() / 1000, 10) * 1000).toISOString().split('T')[0],
      tags: item.tags?.map((tag: any) => tag.tag) || []
    }));
  } catch (error: any) {
    console.error('Error fetching workshop items:', error);
    throw new Error('Failed to fetch workshop items. Please try again later.');
  }
} 