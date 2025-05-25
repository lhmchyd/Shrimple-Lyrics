
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
  return extracted === "" ? null : extracted;
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

English Lyrics:
[Provide the full English lyrics for the song. If restricted, state so.]

Romanized Lyrics:
[Provide the full Romanized lyrics for the song, if applicable. If not applicable for the song's language, state "Not applicable". If restricted, state so.]

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
    console.log("[api/lyrics] Raw text received from Gemini:\n", rawText.substring(0, 300) + (rawText.length > 300 ? "..." : ""));
    
    let songTitle: string | undefined = "Song title not available";
    let artistMetadata: ArtistMetadata | undefined;
    let songDescription: string | undefined = undefined;
    let englishLyrics = "English lyrics not available or not found.";
    let romanizedLyrics: string | undefined = undefined;

    const orderedSectionMarkers = [
        "Song Title:",
        "Artist Information:",
        "Song Meaning/Summary (based on English lyrics you generate):",
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

    const songTitleText = extractSection(rawText, "Song Title:", getEndMarkersForSection("Song Title:"));
    if (songTitleText && songTitleText.trim() !== "" && songTitleText.toLowerCase() !== "not available") {
      songTitle = songTitleText.trim();
    }

    const artistInfoText = extractSection(rawText, "Artist Information:", getEndMarkersForSection("Artist Information:"));
    if (artistInfoText) {
      const nameMatch = artistInfoText.match(/Name:\s*([\s\S]*?)(?=\nBio:|$)/i);
      const bioMatch = artistInfoText.match(/Bio:\s*([\s\S]*)/i);
      let parsedName = nameMatch && nameMatch[1] ? nameMatch[1].trim() : "Not available";
      let parsedBio = bioMatch && bioMatch[1] ? bioMatch[1].trim() : undefined;
      if (parsedBio?.toLowerCase() === "not available" || parsedBio === "") parsedBio = undefined;
      if (parsedName.toLowerCase() === "not available" || parsedName === "") parsedName = "Artist name not available";
      artistMetadata = { name: parsedName, bio: parsedBio };
    }

    const songDescriptionText = extractSection(rawText, "Song Meaning/Summary (based on English lyrics you generate):", getEndMarkersForSection("Song Meaning/Summary (based on English lyrics you generate):"));
    if (songDescriptionText && songDescriptionText.toLowerCase() !== "not available" && songDescriptionText.toLowerCase() !== "not applicable" && songDescriptionText.trim() !== "") {
      songDescription = songDescriptionText.trim();
    }

    const engLyricsText = extractSection(rawText, "English Lyrics:", getEndMarkersForSection("English Lyrics:"));
    if (engLyricsText && engLyricsText.toLowerCase() !== "not available" && engLyricsText.toLowerCase() !== "full lyrics restricted") {
      englishLyrics = engLyricsText;
    }

    const romLyricsText = extractSection(rawText, "Romanized Lyrics:", getEndMarkersForSection("Romanized Lyrics:"));
    if (romLyricsText && romLyricsText.toLowerCase() !== "not applicable" && romLyricsText.toLowerCase() !== "not available" && romLyricsText.toLowerCase() !== "full lyrics restricted") {
      romanizedLyrics = romLyricsText;
    }
    
    let finalArtistBio = artistMetadata?.bio;
    let finalEnglishLyrics = englishLyrics;
    let finalRomanizedLyrics = romanizedLyrics;

    if (finalArtistBio && 
        (finalEnglishLyrics === "English lyrics not available or not found." || finalEnglishLyrics.trim() === "") &&
        (!finalRomanizedLyrics || finalRomanizedLyrics.trim() === "")) {
        const romanizedHeadingPattern = /(Romanized Lyrics for ".*?":\s*|Romanized Lyrics:\s*|English Lyrics for ".*?":\s*|English Lyrics:\s*)/i;
        const match = finalArtistBio.match(romanizedHeadingPattern);
        if (match && typeof match.index === 'number') {
            const potentialLyricsContentBeforeHeading = finalArtistBio.substring(0, match.index).trim();
            const potentialLyricsContentAfterHeading = finalArtistBio.substring(match.index + match[0].length).trim();
            let bioContainedLyrics = false;
            const primaryLyricsContent = potentialLyricsContentAfterHeading;
            if (primaryLyricsContent.length > 50) { 
                if (match[0].toLowerCase().includes("english")) {
                    finalEnglishLyrics = primaryLyricsContent;
                } else if (match[0].toLowerCase().includes("romanized")) {
                    finalRomanizedLyrics = primaryLyricsContent;
                } else { 
                    finalEnglishLyrics = primaryLyricsContent;
                }
                bioContainedLyrics = true;
            }
            if (bioContainedLyrics && artistMetadata) {
                if (potentialLyricsContentBeforeHeading.length < 100 || potentialLyricsContentBeforeHeading.split('\n').length > 3) {
                    finalArtistBio = undefined;
                } else {
                    finalArtistBio = potentialLyricsContentBeforeHeading;
                }
            }
        }
    }
    
    if (artistMetadata) {
        artistMetadata.bio = finalArtistBio; 
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
    
    const result: LyricSearchResult = { songTitle, artistMetadata, songDescription, englishLyrics: finalEnglishLyrics, romanizedLyrics: finalRomanizedLyrics, sources };
    console.log("[api/lyrics] Successfully processed request. Sending result.");
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
