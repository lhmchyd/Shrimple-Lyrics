
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LyricSearchResult, GroundingSource, ArtistMetadata } from '../types';

const API_KEY = process.env.API_KEY;
let ai: GoogleGenAI | null = null;
let initError: string | null = null;

if (API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } catch (e: any) {
    console.error("CRITICAL: Failed to initialize GoogleGenAI client:", e);
    initError = e.message || "Failed to initialize Gemini API client.";
  }
} else {
  initError = "Gemini API Key (process.env.API_KEY) is not configured in the client-side environment.";
  console.error(initError);
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

export const searchLyrics = async (query: string): Promise<LyricSearchResult> => {
  if (!ai) {
    const errorMessage = initError || "Gemini API client is not initialized. Please ensure API_KEY is correctly configured.";
    console.error("[geminiService] Search attempt failed:", errorMessage);
    throw new Error(errorMessage);
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
    console.log(`[geminiService] Making direct Gemini API call for query: "${query}"`);
    const geminiResponse: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    console.log("[geminiService] Gemini API call completed.");

    if (typeof geminiResponse.text !== 'string') {
      let errorMessage = "The API returned an unexpected response format (missing or invalid text content).";
      if (geminiResponse?.candidates?.[0]?.finishReason && geminiResponse.candidates[0].finishReason !== "STOP") {
        errorMessage = `API request finished with reason: ${geminiResponse.candidates[0].finishReason}. No valid text content was returned.`;
      }
      // Log the full response object for better debugging if text is missing.
      console.error('[geminiService] Gemini API response error (missing text). Full response:', JSON.stringify(geminiResponse, null, 2));
      throw new Error(errorMessage);
    }
    
    const rawText = geminiResponse.text;
    console.log("[geminiService] Raw text received from Gemini:\n", rawText.substring(0, 300) + (rawText.length > 300 ? "..." : ""));
    
    let songTitle: string | undefined = "Song title not available";
    let artistMetadata: ArtistMetadata | undefined;
    let songDescription: string | undefined = undefined;
    let englishLyrics = "English lyrics not available or not found.";
    let romanizedLyrics: string | undefined = undefined;

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
    console.log("[geminiService] Successfully processed request. Returning result to UI.");
    return result;

  } catch (error: any) {
    console.error("[geminiService] Error calling Gemini API or processing response:", error);

    if (error instanceof Error) {
        const errorMessageLower = error.message.toLowerCase();

        if (errorMessageLower.includes("recitation")) {
            console.warn(`[geminiService] API content restriction (RECITATION): ${error.message}`);
            throw new Error("Lyrics for this song could not be retrieved due to content restrictions from the API. This is often related to copyright.");
        }
        
        if (errorMessageLower.includes("429") || errorMessageLower.includes("resource_exhausted") || errorMessageLower.includes("safety")) {
            console.warn(`[geminiService] Specific API error detected: ${error.message}. Responding with refined user-friendly message.`);
            throw new Error("Could not fetch the requested information due to API limits or safety filters. Please try again later.");
        }
        
        if (errorMessageLower.includes("api key not valid") || errorMessageLower.includes("permission_denied")) {
            throw new Error("The configured API Key is invalid or missing required permissions. Please check your Gemini API Key.");
        }
        throw new Error(`Failed to search lyrics: ${error.message}`);
    }
    throw new Error("An unknown error occurred while searching for lyrics.");
  }
};
