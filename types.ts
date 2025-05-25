
export interface ArtistMetadata {
  name: string;
  bio?: string;
}

export interface LyricSearchResult {
  songTitle?: string; 
  artistMetadata?: ArtistMetadata;
  englishLyrics: string;
  romanizedLyrics?: string; 
  songDescription?: string; // Added song description
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
