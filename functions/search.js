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
    detailsParams.append('key', apiKey);  // Add API key here
    detailsParams.append('itemcount', fileIds.length.toString());
    fileIds.forEach((id, index) => {
      detailsParams.append(`publishedfileids[${index}]`, id);
    });

    // Add all the required parameters
    detailsParams.append('return_change_notes', '1');
    detailsParams.append('strip_description_bbcode', '0');
    detailsParams.append('return_children', '0');
    detailsParams.append('return_short_description', '1');
    detailsParams.append('return_details', '1');
    detailsParams.append('return_metadata', '1');
    detailsParams.append('return_kv_tags', '1');
    detailsParams.append('return_tags', '1');
    detailsParams.append('return_previews', '1');
    detailsParams.append('return_reactions', '1');
    detailsParams.append('return_reviews', '1');
    detailsParams.append('return_assets', '1');
    detailsParams.append('return_languages', '1');

    const detailsUrl = 'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/';
    console.log('Getting details for IDs:', fileIds);
    console.log('Details request params:', detailsParams.toString());

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
        
        // Add debug logging for the raw vote data
        console.log('Raw vote data for item:', {
          itemId: item.publishedfileid,
          title: item.title,
          vote_data: item.vote_data,
          vote_summary: item.vote_summary
        });

        let rating = {
          score: null,
          votes: 0,
          has_rating: false,
          unrated: true
        };

        // Steam might provide vote data in different fields, let's check both
        if (item.vote_data || item.vote_summary) {
          // Try vote_data first
          const voteScore = parseFloat(item.vote_data?.score) || 0;
          const voteCount = parseInt(item.vote_data?.votes) || parseInt(item.vote_summary?.total) || 0;
          
          console.log('Processing votes:', {
            itemId: item.publishedfileid,
            title: item.title,
            voteScore,
            voteCount,
            rawVoteData: item.vote_data,
            rawVoteSummary: item.vote_summary
          });
          
          if (voteCount > 0) {
            const starRating = voteScore * 5;
            console.log(`Calculated star rating for ${item.title}:`, {
              voteScore,
              starRating,
              voteCount
            });
            
            rating = {
              score: Math.round(starRating * 10) / 10,
              votes: voteCount,
              has_rating: true,
              unrated: false
            };
          }
        }
        
        // Log the final rating object
        console.log('Final rating object:', {
          itemId: item.publishedfileid,
          title: item.title,
          rating
        });
        
        // Add a helper property to clearly indicate unrated status
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