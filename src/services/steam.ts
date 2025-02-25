import type { WorkshopItem } from '../types';

// Steam API endpoint for workshop queries (JSONP version)
const STEAM_API_BASE = 'https://api.steampowered.com/ISteamUGC/GetQueryUGCResults/v1/';

export async function validateSteamApiKey(apiKey: string): Promise<boolean> {
  try {
    const testUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=76561197960435530`;
    const response = await fetch(testUrl);
    
    if (!response.ok) {
      console.error('Steam API key validation failed:', response.status, response.statusText);
      return false;
    }

    const data = await response.json();
    return !!data.response;
  } catch (error) {
    console.error('Error validating Steam API key:', error);
    return false;
  }
}

export async function searchWorkshop(query: string, appId: string): Promise<WorkshopItem[]> {
  try {
    const apiKey = import.meta.env.VITE_STEAM_API_KEY;
    if (!apiKey) {
      throw new Error('Steam API key is not configured');
    }

    // Validate API key first
    const isValid = await validateSteamApiKey(apiKey);
    if (!isValid) {
      throw new Error('Steam API key is invalid or not enabled. Please check your API key configuration.');
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

// Add this function to test the API key specifically
export async function testSteamApiKey(): Promise<void> {
  try {
    const apiKey = import.meta.env.VITE_STEAM_API_KEY;
    if (!apiKey) {
      console.error('❌ Steam API key is not configured in .env file');
      return;
    }

    console.log('🔍 Testing Steam API key...');
    
    // Test GetPlayerSummaries endpoint
    const testUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=76561197960435530`;
    const response = await fetch(testUrl);
    
    console.log('📡 API Response Status:', response.status);
    
    if (!response.ok) {
      console.error('❌ API key validation failed:', response.status, response.statusText);
      console.error('❌ Make sure your API key is registered at: https://steamcommunity.com/dev/apikey');
      return;
    }

    const data = await response.json();
    
    if (data.response) {
      console.log('✅ API key is valid and working!');
    } else {
      console.error('❌ API key returned invalid response format');
    }
    
    // Test Workshop API endpoint
    const workshopUrl = `${STEAM_API_BASE}?${new URLSearchParams({
      key: apiKey,
      appid: '221100', // DayZ App ID
      query_type: '1',
      numperpage: '1',
      cursor: '*',
      return_details: 'true',
      format: 'json'
    })}`;

    const workshopResponse = await fetch(workshopUrl);
    console.log('📡 Workshop API Response Status:', workshopResponse.status);
    
    if (!workshopResponse.ok) {
      console.error('❌ Workshop API access failed:', workshopResponse.status, workshopResponse.statusText);
      return;
    }

    const workshopData = await workshopResponse.json();
    if (workshopData.response) {
      console.log('✅ Workshop API access is working!');
    } else {
      console.error('❌ Workshop API returned invalid response format');
    }

  } catch (error) {
    console.error('❌ Error testing API key:', error);
  }
}