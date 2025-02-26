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

async function fetchWorkshopChangelog(apiKey, fileId) {
  try {
    // Use the main details page instead of changelog
    const url = `https://steamcommunity.com/sharedfiles/filedetails/?id=${fileId}`;
    
    // Add headers to look like a browser request
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    const html = await response.text();

    // Look for the update history section
    const historyMatch = html.match(/<div class="detailBox" id="updateHistoryContent">([\s\S]*?)<\/div>/i);
    if (historyMatch) {
      let changeNotes = historyMatch[1]
        .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> to newlines
        .replace(/<[^>]*>/g, '')        // Remove other HTML tags
        .replace(/&nbsp;/g, ' ')        // Fix HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n\s+/g, '\n')        // Remove extra spaces after newlines
        .trim();

      console.log('Found changelog:', {
        fileId,
        changeNotesPreview: changeNotes.substring(0, 100) + '...'
      });

      return changeNotes;
    }

    // If no update history found, try looking for individual updates
    const updateMatch = html.match(/Update:([\s\S]*?)(?=Update:|$)/gi);
    if (updateMatch) {
      const changeNotes = updateMatch
        .map(update => update.trim())
        .join('\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n\s+/g, '\n')
        .trim();

      return changeNotes;
    }

    return null;
  } catch (error) {
    console.error('Error fetching changelog:', error);
    return null;
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
      return_change_notes: '1',
      return_subscriptions: '1',
      return_for_sale_data: '1',
      return_ratings: '1',
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
    
    async function getItemDetails(fileIds) {
      // Try the PublishedFileService endpoint first
      try {
        const detailsUrl = 'https://api.steampowered.com/IPublishedFileService/GetDetails/v1/';
        const params = new URLSearchParams({
          key: apiKey,
          itemcount: fileIds.length.toString(),
          include_votes: '1',
          include_vote_data: '1',
          strip_description_bbcode: '1',
          return_short_description: '1',
          return_metadata: '1',
          return_playtime_stats: '1',
          return_tags: '1',
          return_previews: '1',
          return_reactions: '1',
          return_reviews: '1'
        });

        fileIds.forEach((id, index) => {
          params.append(`publishedfileids[${index}]`, id);
        });

        const response = await fetch(`${detailsUrl}?${params.toString()}`);
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        
        return await response.json();
      } catch (error) {
        // Fallback to the original endpoint
        console.log('Falling back to original endpoint...');
        const fallbackUrl = 'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/';
        const params = new URLSearchParams({
          itemcount: fileIds.length.toString()
        });
        
        fileIds.forEach((id, index) => {
          params.append(`publishedfileids[${index}]`, id);
        });

        const response = await fetch(fallbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });

        if (!response.ok) throw new Error(`Fallback API returned ${response.status}`);
        return await response.json();
      }
    }

    const detailsData = await getItemDetails(fileIds);

    // After getting the details response
    console.log('Workshop item details:', JSON.stringify(
      detailsData.response.publishedfiledetails.map(item => ({
        id: item.publishedfileid,
        title: item.title,
        hasChangeNotes: !!item.change_notes
      })),
      null,
      2
    ));

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

    // Then remove the separate fetchChangeNotes function and simplify the itemsWithUserDetails mapping:
    const itemsWithUserDetails = await Promise.all(
      detailsData.response.publishedfiledetails.map(async (item) => {
        const user = userMap.get(item.creator);
        const changelog = await fetchWorkshopChangelog(apiKey, item.publishedfileid);
        
        // Log all possible vote-related fields
        console.log('All vote-related fields:', {
          id: item.publishedfileid,
          title: item.title,
          votes_up: item.votes_up,
          vote_up: item.vote_up,
          upvotes: item.upvotes,
          votes_down: item.votes_down,
          vote_down: item.vote_down,
          downvotes: item.downvotes,
          score: item.score,
          vote_score: item.vote_score,
          vote_data: item.vote_data,
          lifetime_votes: item.lifetime_votes,
          total_votes: item.total_votes,
          positive_votes_percent: item.positive_votes_percent,
          raw_item: item // Log the entire item to see all fields
        });

        let rating = {
          score: null,
          votes: 0,
          has_rating: false,
          unrated: true
        };

        // Try all possible vote field combinations
        const votesUp = parseInt(item.votes_up || item.vote_up || item.upvotes || 0);
        const votesDown = parseInt(item.votes_down || item.vote_down || item.downvotes || 0);
        const totalVotes = parseInt(item.total_votes || item.lifetime_votes || 0) || (votesUp + votesDown);
        const positivePercent = parseFloat(item.positive_votes_percent || item.score || 0);

        if (totalVotes > 0) {
          const score = positivePercent / 100; // Convert percentage to 0-1 scale
          const starRating = score * 5;

          rating = {
            score: Math.round(starRating * 10) / 10,
            votes: totalVotes,
            has_rating: true,
            unrated: false
          };
        }

        return {
          ...item,
          creator_name: user?.personaname || 'Unknown',
          creator_profile: user?.profileurl || null,
          change_notes: changelog || undefined,
          rating: rating
        };
      })
    );

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