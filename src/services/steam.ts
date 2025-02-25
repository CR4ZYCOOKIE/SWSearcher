const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

export async function testSteamApiKey(): Promise<void> {
  try {
    const apiKey = import.meta.env.VITE_STEAM_API_KEY;
    if (!apiKey) {
      console.error('❌ Steam API key is not configured in .env file');
      return;
    }

    console.log('🔍 Testing Steam API key...');
    
    // Test GetPlayerSummaries endpoint with CORS proxy
    const testUrl = `${CORS_PROXY}https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=76561197960435530`;
    
    const response = await fetch(testUrl, {
      headers: {
        'Origin': window.location.origin,
      }
    });
    
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
    
    // Test Workshop API endpoint with CORS proxy
    const workshopUrl = `${CORS_PROXY}${STEAM_API_BASE}?${new URLSearchParams({
      key: apiKey,
      appid: '221100', // DayZ App ID
      query_type: '1',
      numperpage: '1',
      cursor: '*',
      return_details: 'true',
      format: 'json'
    })}`;

    const workshopResponse = await fetch(workshopUrl, {
      headers: {
        'Origin': window.location.origin,
      }
    });
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

// Also update your searchWorkshop function to use the CORS proxy
export async function searchWorkshop(query: string, appId: string): Promise<WorkshopItem[]> {
  try {
    // ... existing validation code ...

    const params = new URLSearchParams({
      key: apiKey,
      appid: appId,
      query_type: '1',
      search_text: query,
      numperpage: '10',
      cursor: '*',
      sort_order: '0',
      return_tags: 'true',
      return_details: 'true',
      return_metadata: 'true',
      return_previews: 'true',
      language: '0',
      format: 'json'
    });

    const response = await fetch(`${CORS_PROXY}${STEAM_API_BASE}?${params.toString()}`, {
      headers: {
        'Origin': window.location.origin,
      }
    });
    
    // ... rest of your existing code ...
  } catch (error) {
    console.error('❌ Error searching workshop:', error);
    return [];
  }
} 