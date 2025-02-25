import fetch from 'node-fetch';

async function fetchUserDetails(apiKey, steamIds) {
  try {
    // Steam API allows multiple IDs in one request
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamIds.join(',')}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`User API returned ${response.status}`);
    }
    const data = await response.json();
    return data.response?.players || [];
  } catch (error) {
    console.error('Error fetching user details:', error);
    return [];
  }
}

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const { query, page = 1 } = JSON.parse(event.body || '{}');
    const apiKey = event.env?.VITE_STEAM_API_KEY || process.env.VITE_STEAM_API_KEY;

    if (!apiKey) {
      console.error('API key missing');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Steam API key not configured' })
      };
    }

    // Special handling for banned mods search
    const isBannedSearch = query.toUpperCase() === 'SHOW BANNED MODS';

    // First, search for items to get IDs
    const searchParams = new URLSearchParams({
      key: apiKey,
      search_text: isBannedSearch ? '' : query || '',
      page: page.toString(),
      numperpage: isBannedSearch ? '100' : '20',
      appid: '221100',
      return_metadata: '1',
      return_tags: '1',
      return_details: '1',
      return_children: '0',
      return_short_description: '1',
      return_vote_data: '1',
      return_previews: '1',
      format: 'json'
    });

    const searchUrl = `https://api.steampowered.com/IPublishedFileService/QueryFiles/v1/?${searchParams}`;
    console.log('Making search request:', searchUrl);
    console.log('Search query:', query, 'Page:', page);

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`Search API returned ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Search response:', JSON.stringify(searchData, null, 2));

    // If searching for banned mods, filter the results
    let filteredDetails = searchData.response?.publishedfiledetails || [];
    if (isBannedSearch) {
      filteredDetails = filteredDetails.filter(item => item.banned || item.ban_reason);
      
      // Adjust for pagination
      const startIndex = (page - 1) * 20;
      const endIndex = startIndex + 20;
      filteredDetails = filteredDetails.slice(startIndex, endIndex);
    }

    if (!filteredDetails.length) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          response: {
            publishedfiledetails: [],
            total: 0
          }
        })
      };
    }

    // Get details for the found items
    const fileIds = filteredDetails.map(item => item.publishedfileid);
    
    const detailsParams = new URLSearchParams();
    detailsParams.append('itemcount', fileIds.length.toString());
    fileIds.forEach((id, index) => {
      detailsParams.append(`publishedfileids[${index}]`, id);
    });

    const detailsUrl = 'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/';
    console.log('Getting details for IDs:', fileIds);

    const detailsResponse = await fetch(detailsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: detailsParams
    });

    if (!detailsResponse.ok) {
      throw new Error(`Details API returned ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();
    console.log('Details response:', JSON.stringify(detailsData, null, 2));

    // Get unique creator IDs
    const creatorIds = [...new Set(
      detailsData.response.publishedfiledetails
        .map(item => item.creator)
        .filter(Boolean)
    )];

    // Fetch all user details in one request
    const userDetails = await fetchUserDetails(apiKey, creatorIds);
    
    // Create a map of user details for quick lookup
    const userMap = new Map(
      userDetails.map(user => [user.steamid, user])
    );

    // Add user details to the workshop items
    const itemsWithUserDetails = detailsData.response.publishedfiledetails.map(item => {
      const user = userMap.get(item.creator);
      return {
        ...item,
        creator_name: user?.personaname || 'Unknown',
        creator_profile: user?.profileurl || null
      };
    });

    // Combine the data
    const combinedResponse = {
      response: {
        publishedfiledetails: itemsWithUserDetails,
        total: isBannedSearch ? filteredDetails.length : searchData.response.total
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(combinedResponse)
    };

  } catch (error) {
    console.error('Search function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
} 