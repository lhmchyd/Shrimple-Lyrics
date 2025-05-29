
export interface ArtistMetadata {
  name: string;
  bio?: string;
}

export interface LyricSearchResult {
  songTitle?: string; 
  artistMetadata?: ArtistMetadata;
  originalLanguage?: string; // Added original language
  originalLyrics?: string; // Added original lyrics
  englishLyrics: string;
  romanizedLyrics?: string; 
  songDescription?: string; 
  sources: GroundingSource[];
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface SearchHistoryEntry {
  id: string; 
  query: string;
  timestamp: number;
}