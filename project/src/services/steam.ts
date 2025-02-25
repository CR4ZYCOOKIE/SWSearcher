import type { WorkshopItem } from '../types';

// Steam API endpoint for workshop queries (JSONP version)
const STEAM_API_BASE = 'https://api.steampowered.com/ISteamUGC/GetQueryUGCResults/v1/';

export async function searchWorkshop(query: string, appId: string): Promise<WorkshopItem[]> {
  try {
    // Validate API key
    const apiKey = import.meta.env.VITE_STEAM_API_KEY;
    if (!apiKey) {
      throw new Error('Steam API key is not configured');
    }

    const params = new URLSearchParams({
      key: apiKey,
      appid: appId,
      query_type: '1', // Recent updates
      search_text: query,
      numperpage: '10',
      cursor: '*',
      sort_order: '0', // Most relevant
      return_tags: 'true',
      return_details: 'true',
      return_metadata: 'true',
      return_previews: 'true',
      language: '0',
      format: 'json'
    });

    const response = await fetch(`${STEAM_API_BASE}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Steam API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data?.response) {
      throw new Error('Invalid response from Steam API');
    }

    const { publishedfiledetails } = data.response;
    
    if (!Array.isArray(publishedfiledetails)) {
      throw new Error('No workshop items found in response');
    }

    return publishedfiledetails.map((item: any) => ({
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
    
    if (!navigator.onLine) {
      throw new Error('No internet connection. Please check your network.');
    } else if (error.message.includes('API key')) {
      throw new Error(error.message);
    }
    
    throw new Error('Failed to fetch workshop items. Please check your Steam API key and try again.');
  }
}