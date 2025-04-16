const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

const axiosInstance = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept-Language': 'en-US,en;q=0.9',
  }
});

const scrapeLyrics = async (query) => {
  try {
    const words = query.trim().split(/\s+/);
    if (words.length < 2) {
      return { error: 'Please use format: "artist title" (e.g., "natori in my head")' };
    }

    // Take first word as artist, rest as title
    const artist = words[0];
    const title = words.slice(1).join('-');

    const urlArtist = artist.toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    
    const urlTitle = title.toLowerCase()
      .replace(/[^a-z0-9\-]/g, '');  // keep hyphens

    const directUrl = `https://www.lyrical-nonsense.com/global/lyrics/${urlArtist}/${urlTitle}/#Romaji`;
    console.log(`🔍 Accessing: ${directUrl}`);
    
    try {
      const lyricsRes = await axiosInstance.get(directUrl);
      const $lyrics = cheerio.load(lyricsRes.data);
      return extractLyrics($lyrics, directUrl);
    } catch (err) {
      console.error(`❌ Failed to fetch lyrics: ${err.message}`);
      return { error: 'Could not find lyrics. Make sure artist and song names are correct.' };
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    return { error: `Failed to process request: ${err.message}` };
  }
};

// Helper function to extract lyrics from the page
const extractLyrics = ($, url) => {
  // Update selectors to get title and artist from URL if page doesn't have them
  const urlParts = url.split('/');
  const urlTitle = urlParts[urlParts.length - 2];
  const urlArtist = urlParts[urlParts.length - 3];

  // Try to get from page first, fallback to URL values
  const songTitle = $('.titletext h1').text().trim() || urlTitle;
  const artist = $('.titletext h2').text().trim() || urlArtist;

  // Capitalize first letter
  const formattedTitle = songTitle.charAt(0).toUpperCase() + songTitle.slice(1);
  const formattedArtist = artist.charAt(0).toUpperCase() + artist.slice(1);

  const getLyrics = () => {
    const lyrics = [];
    $('#PriLyr.olyrictext .line-text').each((_, el) => {
      const line = $(el)
        .text()
        .replace(/<br>/g, '')
        .trim();
      if (line && !/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(line)) {
        lyrics.push(line);
      }
    });
    return lyrics.join('\n');
  };

  const romajiLyrics = getLyrics();

  if (!romajiLyrics) {
    console.log('⚠️ No romaji lyrics found in primary lyrics section');
    return { error: 'Could not extract romaji lyrics from the page' };
  }

  // Debug log
  console.log('📌 Found title:', formattedTitle);
  console.log('📌 Found artist:', formattedArtist);

  return {
    title: formattedTitle,
    artist: formattedArtist,
    url: url,
    lyrics: romajiLyrics
  };
};

// Add before the lyrics endpoint
app.get('/', (req, res) => {
  res.json({
    name: "Lyrical Nonsense Scraper API",
    version: "1.0.0",
    description: "API for scraping romaji lyrics from Lyrical Nonsense",
    endpoints: {
      "/": {
        method: "GET",
      },
      "/lyrics": {
        method: "GET",
        description: "Get romaji lyrics for a song",
        parameters: {
          title: "String (required) - Format: 'artist title'",
        },
        example: "/lyrics?title=natori terminal"
      }
    },
    github: "https://github.com/lhmchyd/Shrimple-Lyrics"
  });
});

app.get('/lyrics', async (req, res) => {
  const query = req.query.title;
  if (!query || query.trim().split(/\s+/).length < 2) {
    return res.status(400).json({ 
      error: 'Please provide song in format: "artist title"'
    }, null, 2);
  }

  const result = await scrapeLyrics(query);
  if (result.error) {
    return res.status(404).json(result, null, 2);
  }

  // Format lyrics into an array of lines for better readability
  if (result.lyrics) {
    result.lyrics = result.lyrics.split('\n');
  }

  // Send formatted JSON response
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(result, null, 2));
});

// Export the Express API
module.exports = app;
