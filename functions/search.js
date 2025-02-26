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
      // Try the ISteamUGC endpoint first
      try {
        const detailsUrl = 'https://api.steampowered.com/ISteamUGC/GetPublishedFileDetails/v1/';
        const params = new URLSearchParams({
          key: apiKey
        });
        
        fileIds.forEach((id, index) => {
          params.append(`publishedfileids[${index}]`, id);
        });
        params.append('itemcount', fileIds.length.toString());

        console.log('Trying ISteamUGC endpoint...');
        
        const response = await fetch(detailsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });

        if (!response.ok) throw new Error(`API returned ${response.status}`);
        
        const data = await response.json();
        console.log('ISteamUGC response:', JSON.stringify(data, null, 2));
        return data;
      } catch (firstError) {
        console.log('First endpoint failed, trying fallback...', firstError);
        
        // Fallback to the RemoteStorage endpoint
        try {
          const fallbackUrl = 'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/';
          const params = new URLSearchParams({
            key: apiKey
          });
          
          fileIds.forEach((id, index) => {
            params.append(`publishedfileids[${index}]`, id);
          });
          params.append('itemcount', fileIds.length.toString());

          console.log('Trying RemoteStorage endpoint...');
          
          const response = await fetch(fallbackUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
          });

          if (!response.ok) throw new Error(`Fallback API returned ${response.status}`);
          
          const data = await response.json();
          console.log('RemoteStorage response:', JSON.stringify(data, null, 2));
          return data;
        } catch (secondError) {
          console.error('Both endpoints failed:', secondError);
          throw secondError;
        }
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
        
        // Log the raw item first
        console.log('Raw item data:', JSON.stringify(item, null, 2));

        // Try to get vote data from different possible locations
        const voteData = {
          votesUp: parseInt(item.votes_up || item.vote_up || item.upvotes || item.subscriptions || 0),
          votesDown: parseInt(item.votes_down || item.vote_down || item.downvotes || 0),
          totalVotes: parseInt(item.total_votes || item.lifetime_votes || item.subscriptions || 0),
          score: parseFloat(item.score || item.vote_score || 0),
          favorited: parseInt(item.favorited || 0)
        };

        console.log('Processed vote data:', {
          itemId: item.publishedfileid,
          title: item.title,
          ...voteData
        });

        let rating = {
          score: null,
          votes: 0,
          has_rating: false,
          unrated: true
        };

        if (voteData.totalVotes > 0 || voteData.favorited > 0) {
          // If we have a direct score, use it
          if (voteData.score > 0) {
            rating = {
              score: Math.round((voteData.score * 5) * 10) / 10,
              votes: voteData.totalVotes,
              has_rating: true,
              unrated: false
            };
          } 
          // Otherwise calculate from favorited count
          else if (voteData.favorited > 0) {
            rating = {
              score: 5, // Assume 5 stars if favorited
              votes: voteData.favorited,
              has_rating: true,
              unrated: false
            };
          }
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