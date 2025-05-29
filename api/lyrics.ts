
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { LyricSearchResult, GroundingSource, ArtistMetadata } from '../types';

// This type is for Vercel's request and response objects.
// For simplicity, using `any` here, but you can install `@vercel/node`
// for `VercelRequest` and `VercelResponse` types if you have a package.json.
interface VercelRequest {
  method?: string;
  query: { [key: string]: string | string[] | undefined };
  // Add other properties if needed, e.g., body
}

interface VercelResponse {
  status: (statusCode: number) => VercelResponse;
  json: (body: any) => VercelResponse;
  setHeader: (name: string, value: string | string[]) => VercelResponse;
  end: (body?: string) => VercelResponse;
}

const API_KEY = process.env.API_KEY;
let ai: GoogleGenAI | null = null;

if (API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } catch (e) {
    console.error("CRITICAL: Failed to initialize GoogleGenAI client at module level:", e);
    // ai will remain null. The handler will check for this and return a 500.
  }
} else {
  // This message will appear in Vercel function logs if API_KEY is not set
  console.error("Gemini API Key not found in serverless function environment. Please set the API_KEY environment variable.");
}

const extractSection = (text: string, startMarker: string, endMarkers: string[]): string | null => {
  const lowerText = text.toLowerCase();
  const lowerStartMarker = startMarker.toLowerCase();

  const foundStartMarkerIndex = lowerText.indexOf(lowerStartMarker);
  if (foundStartMarkerIndex === -1) {
    return null; 
  }
  
  const startIndexActual = foundStartMarkerIndex + startMarker.length;
  let endIndexActual = text.length; 

  for (const endMarker of endMarkers) {
    const lowerEndMarker = endMarker.toLowerCase();
    const foundEndMarkerIndex = lowerText.indexOf(lowerEndMarker, startIndexActual); 
    if (foundEndMarkerIndex !== -1) {
      endIndexActual = Math.min(endIndexActual, foundEndMarkerIndex);
    }
  }
  
  const extracted = text.substring(startIndexActual, endIndexActual).trim();
  // Return null if extracted is empty or common "not available" phrases, case-insensitively
  if (extracted === "" || 
      extracted.toLowerCase() === "not available" || 
      extracted.toLowerCase() === "not applicable" ||
      extracted.toLowerCase() === "full lyrics restricted" ||
      extracted.toLowerCase() === "lyrics not available") {
    return null;
  }
  return extracted;
};

const orderedSectionMarkers = [
    "Song Title:",
    "Artist Information:",
    "Song Meaning/Summary (based on English lyrics you generate):",
    "Original Language:",
    "Original Lyrics:",
    "English Lyrics:",
    "Romanized Lyrics:",
];

const getEndMarkersForSection = (currentSectionMarker: string) => {
    const currentIndex = orderedSectionMarkers.indexOf(currentSectionMarker);
    if (currentIndex === -1 || currentIndex === orderedSectionMarkers.length - 1) { 
        return []; 
    }
    return orderedSectionMarkers.slice(currentIndex + 1);
};


export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Log added for debugging 404s - check vercel dev console
  console.log(`[api/lyrics] Handler invoked. Method: ${req.method}, Query: ${JSON.stringify(req.query)}`);

  if (req.method !== 'GET') {
    console.log("[api/lyrics] Method not GET, returning 405.");
    res.setHeader('Allow', ['GET']);
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  if (!ai) {
    console.error('[api/lyrics] Gemini API client not initialized. This could be due to a missing API_KEY or an error during client setup.');
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: "Lyrics service is not configured correctly. API client failed to initialize." });
  }

  const query = req.query.query as string;

  if (!query) {
    console.log("[api/lyrics] Query parameter missing, returning 400.");
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  const model = 'gemini-2.5-flash-preview-04-17';
  const fullPrompt = `Please provide the following information for the song: "${query}".
Use your knowledge and web search capabilities if needed.
Structure your response exactly as follows, using these exact headings and newlines.
If a section is not applicable or information is unavailable, state "Not available" or "Not applicable" for that section.
If you cannot provide full lyrics due to copyright or other restrictions, please state "Full lyrics restricted" or "Lyrics not available" in the lyrics section and, if possible, provide a brief reason.

Song Title: [Song Title]

Artist Information:
Name: [Artist Name]
Bio: [Provide a brief artist biography or notable facts. If not available, state "Not available".]

Song Meaning/Summary (based on English lyrics you generate):
[Provide a brief (2-3 sentences) summary or interpretation of the song based on the lyrics you generate. If lyrics are unavailable or meaning is too ambiguous, state "Not available".]

Original Language: [Detected Original Language of the Song - e.g., Korean, Japanese, English, Spanish, Russian. If the song is instrumental, state 'Instrumental'. If mixed, state primary language or 'Mixed'. If not available, state "Not available".]

Original Lyrics: [Provide the full lyrics in the Original Language identified above. If the Original Language is English, provide the English lyrics here. If instrumental, state 'Instrumental'. If restricted, state so. If not available, state "Not available".]

English Lyrics:
[Provide the full English lyrics for the song. If the original language is English and you've already provided them under "Original Lyrics", you can state "Same as Original Lyrics" or re-list them. If restricted, state so. If not available, state "Not available".]

Romanized Lyrics:
[Provide the full Romanized lyrics for the song, if applicable (e.g., for languages not using a Latin-based script such as Korean, Japanese, Russian, Greek, Arabic, Hindi, Thai, etc.). If the original language already uses a Latin script (e.g., English, Spanish, Indonesian), state "Not applicable". If restricted, state "Full lyrics restricted". If not available, state "Not available".]

Please ensure each section is clearly delineated.`;

  try {
    console.log(`[api/lyrics] Making Gemini API call for query: "${query}"`);
    const geminiResponse: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    console.log("[api/lyrics] Gemini API call completed.");

    if (typeof geminiResponse.text !== 'string') {
      let errorMessage = "The API returned an unexpected response format (missing or invalid text content).";
      if (geminiResponse?.candidates?.[0]?.finishReason && geminiResponse.candidates[0].finishReason !== "STOP") {
        errorMessage = `API request finished with reason: ${geminiResponse.candidates[0].finishReason}. No valid text content was returned.`;
      }
      console.error('[api/lyrics] Gemini API response error:', geminiResponse);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ error: errorMessage });
    }
    
    const rawText = geminiResponse.text;
    console.log("[api/lyrics] Raw text received from Gemini:\n", rawText.substring(0, 500) + (rawText.length > 500 ? "..." : ""));
    
    let songTitle: string | undefined = "Song title not available";
    let artistMetadata: ArtistMetadata | undefined;
    let songDescription: string | undefined = undefined;
    let originalLanguage: string | undefined = undefined;
    let originalLyrics: string | undefined = undefined;
    let englishLyrics = "English lyrics not available or not found.";
    let romanizedLyrics: string | undefined = undefined;

    const songTitleText = extractSection(rawText, "Song Title:", getEndMarkersForSection("Song Title:"));
    if (songTitleText) {
      songTitle = songTitleText;
    }

    const artistInfoText = extractSection(rawText, "Artist Information:", getEndMarkersForSection("Artist Information:"));
    if (artistInfoText) {
      const nameMatch = artistInfoText.match(/Name:\s*([\s\S]*?)(?=\nBio:|$)/i);
      const bioMatch = artistInfoText.match(/Bio:\s*([\s\S]*)/i);
      let parsedName = nameMatch?.[1]?.trim();
      let parsedBio = bioMatch?.[1]?.trim();
      if (!parsedName || parsedName.toLowerCase() === "not available") parsedName = "Artist name not available";
      if (!parsedBio || parsedBio.toLowerCase() === "not available") parsedBio = undefined;
      artistMetadata = { name: parsedName, bio: parsedBio };
    }

    const songDescriptionText = extractSection(rawText, "Song Meaning/Summary (based on English lyrics you generate):", getEndMarkersForSection("Song Meaning/Summary (based on English lyrics you generate):"));
    if (songDescriptionText) {
      songDescription = songDescriptionText;
    }
    
    const originalLanguageText = extractSection(rawText, "Original Language:", getEndMarkersForSection("Original Language:"));
    if (originalLanguageText) {
      originalLanguage = originalLanguageText;
    }

    const originalLyricsText = extractSection(rawText, "Original Lyrics:", getEndMarkersForSection("Original Lyrics:"));
    if (originalLyricsText) {
      originalLyrics = originalLyricsText;
    }
    
    const engLyricsText = extractSection(rawText, "English Lyrics:", getEndMarkersForSection("English Lyrics:"));
    if (engLyricsText) {
      if (engLyricsText.toLowerCase() === "same as original lyrics" && originalLyrics) {
        englishLyrics = originalLyrics;
      } else {
        englishLyrics = engLyricsText;
      }
    }

     // If original language is English and original lyrics are set, ensure English lyrics match.
    if (originalLanguage?.toLowerCase().includes("english") && originalLyrics) {
        englishLyrics = originalLyrics;
    }
    // If original lyrics are not provided but English lyrics are, and original language is English, set original to English.
    if (!originalLyrics && englishLyrics !== "English lyrics not available or not found." && originalLanguage?.toLowerCase().includes("english")) {
        originalLyrics = englishLyrics;
    }


    const romLyricsText = extractSection(rawText, "Romanized Lyrics:", getEndMarkersForSection("Romanized Lyrics:"));
    if (romLyricsText) {
      romanizedLyrics = romLyricsText;
    }
    
    let sources: GroundingSource[] = [];
    const groundingMetadata = geminiResponse.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.groundingChunks && groundingMetadata.groundingChunks.length > 0) {
        sources = groundingMetadata.groundingChunks
            .filter(chunk => chunk.web && chunk.web.uri)
            .map(chunk => ({
                uri: chunk.web!.uri,
                title: chunk.web!.title || chunk.web!.uri
            }));
    }
    
    const result: LyricSearchResult = { 
        songTitle, 
        artistMetadata, 
        songDescription, 
        originalLanguage,
        originalLyrics,
        englishLyrics, 
        romanizedLyrics, 
        sources 
    };
    console.log("[api/lyrics] Successfully processed request. Sending result:", JSON.stringify(result, null, 2));
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(result);

  } catch (error: any) {
    console.error("[api/lyrics] Error in serverless function calling Gemini API or processing response:", error);
    const userFriendlyErrorMessage = "Could not fetch the requested information via the serverless function. Please try again.";
    res.setHeader('Content-Type', 'application/json');

    if (error instanceof Error) {
        const errorMessageLower = error.message.toLowerCase();
        if (errorMessageLower.includes("429") || errorMessageLower.includes("resource_exhausted") || errorMessageLower.includes("recitation") || errorMessageLower.includes("safety")) {
            console.warn(`[api/lyrics] Specific API error detected: ${error.message}. Responding with user-friendly message.`);
            return res.status(500).json({ error: userFriendlyErrorMessage });
        }
         return res.status(500).json({ error: `Failed to search lyrics via API: ${error.message}` });
    }
    return res.status(500).json({ error: "An unknown error occurred in the lyrics API route." });
  }
}
