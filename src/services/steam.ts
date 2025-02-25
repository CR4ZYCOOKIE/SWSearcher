import type { WorkshopItem } from '../types';
import { getSteamApiKey } from '../utils/config';

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

export async function searchWorkshop(query: string, appId: string, page: number = 1): Promise<{ items: WorkshopItem[], total: number }> {
  try {
    console.log('Making API request...');
    const response = await fetch('/.netlify/functions/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, appId, page })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('API Error Response:', text);
      throw new Error(`API returned ${response.status}: ${text}`);
    }

    const data = await response.json();
    console.log('Steam API response:', data);

    if (!data?.response?.publishedfiledetails) {
      throw new Error('Invalid response from API');
    }

    const items = data.response.publishedfiledetails.map((item: any) => {
      console.log('Raw item data:', item); // Debug log
      return {
        id: item.publishedfileid,
        title: item.title || 'Untitled',
        description: item.description || 'No description available',
        author: {
          id: item.creator || 'Unknown',
          name: item.creator_name || 'Unknown',
          profileUrl: item.creator_profile || null,
          workshopUrl: `https://steamcommunity.com/profiles/${item.creator}/myworkshopfiles/?appid=221100`
        },
        thumbnailUrl: item.preview_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80',
        rating: parseFloat(((item.vote_data?.score || 0) * 5).toFixed(1)) || 5,
        downloads: parseInt(item.subscriptions || '0', 10),
        lastUpdated: new Date(parseInt(item.time_updated || Date.now() / 1000, 10) * 1000).toISOString().split('T')[0],
        tags: item.tags?.map((tag: any) => tag.tag) || [],
        banned: item.banned || false,
        banReason: item.ban_reason || undefined,
        currentSubscribers: parseInt(item.subscriptions || '0', 10),
        totalSubscribers: parseInt(item.lifetime_subscriptions || '0', 10),
        currentRating: parseFloat(((item.vote_data?.score || 0) * 5).toFixed(1)) || 5,
        totalRatings: parseInt(item.vote_data?.votes || '0', 10),
        changeNotes: item.change_notes || undefined
      };
    });

    return {
      items,
      total: data.response.total || items.length
    };
  } catch (error) {
    console.error('Error fetching workshop items:', error);
    throw error;
  }
}

export async function testApi(): Promise<void> {
  try {
    console.log('Testing API...');
    const response = await fetch('/.netlify/functions/test-steam');
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('API Test Results:', data);
  } catch (error) {
    console.error('API Test Error:', error);
  }
}

async function fetchUserDetails(steamId: string): Promise<any> {
  try {
    const apiKey = getSteamApiKey();
    if (!apiKey) {
      console.error('Steam API key not found');
      return null;
    }

    const response = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    return data.response.players[0] || null;
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
} 