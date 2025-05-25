
import React, { useState, useEffect } from 'react';
import { LyricSearchResult } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import LyricsSearchPageSkeleton from '../components/skeletons/LyricsSearchPageSkeleton'; 
import MarkdownRenderer from '../components/MarkdownRenderer';
import { Button } from '../components/ui/button';

// Manually include lucide-react icons
const LucideIcons = {
  User: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  Music2: (props: React.SVGProps<SVGSVGElement>) => ( 
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="8" cy="18" r="4"/><path d="M12 18V2l7 4V22"/><path d="M12 2v7.55L19 14"/><path d="m20 10-7-4"/></svg>
  ),
  Languages: (props: React.SVGProps<SVGSVGElement>) => ( 
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>
  ),
  AlertTriangle: (props: React.SVGProps<SVGSVGElement>) => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
  ),
  Link: (props: React.SVGProps<SVGSVGElement>) => ( 
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
  ),
  Download: (props: React.SVGProps<SVGSVGElement>) => ( 
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
  ),
};

interface LyricsSearchPageProps {
  searchResult: LyricSearchResult | null;
  isLoading: boolean;
  error: string | null;
  isChatActive: boolean;
  currentQuery: string | null;
}

type ActiveLyricsTab = 'english' | 'romanized';

const formatLyricsForNumberedDisplay = (lyricText?: string): string => {
  if (!lyricText || lyricText.trim() === "") return "";
  return lyricText.split('\n').map(line => `1. ${line}`).join('\n');
};

const LyricsSearchPage: React.FC<LyricsSearchPageProps> = ({
  searchResult,
  isLoading,
  error,
  isChatActive,
  currentQuery
}) => {
  const [activeLyricsTab, setActiveLyricsTab] = useState<ActiveLyricsTab>('english');

  const hasActualEnglishLyrics = !!searchResult?.englishLyrics && searchResult.englishLyrics !== "English lyrics not available or not found.";
  const hasActualRomanizedLyrics = !!searchResult?.romanizedLyrics && searchResult.romanizedLyrics.trim() !== "";
  
  const showEnglishLyricsSectionWhenNoTabs = hasActualEnglishLyrics || 
                                   (searchResult?.englishLyrics === "English lyrics not available or not found." && !hasActualRomanizedLyrics);
  
  const showLyricsCard = hasActualEnglishLyrics || hasActualRomanizedLyrics || (searchResult?.englishLyrics === "English lyrics not available or not found.");

  const isSongTitleAvailable = searchResult?.songTitle && searchResult.songTitle.toLowerCase() !== 'song title not available';
  const isSongDescriptionAvailable = searchResult?.songDescription && searchResult.songDescription.trim() !== "" && searchResult.songDescription.toLowerCase() !== 'not available';

  useEffect(() => {
    if (hasActualEnglishLyrics) {
      setActiveLyricsTab('english');
    } else if (hasActualRomanizedLyrics) {
      setActiveLyricsTab('romanized');
    } else {
      setActiveLyricsTab('english'); 
    }
  }, [searchResult, hasActualEnglishLyrics, hasActualRomanizedLyrics]);

  const formattedEnglishLyrics = formatLyricsForNumberedDisplay(searchResult?.englishLyrics);
  const formattedRomanizedLyrics = formatLyricsForNumberedDisplay(searchResult?.romanizedLyrics);

  const handleDownloadLyrics = () => {
    if (!searchResult) return;

    let lyricsToDownload: string | undefined;
    let languageLabel: string;

    if (hasActualEnglishLyrics && hasActualRomanizedLyrics) { 
      if (activeLyricsTab === 'english' && hasActualEnglishLyrics) {
        lyricsToDownload = searchResult.englishLyrics;
        languageLabel = 'English';
      } else if (activeLyricsTab === 'romanized' && hasActualRomanizedLyrics) {
        lyricsToDownload = searchResult.romanizedLyrics;
        languageLabel = 'Romanized';
      } else {
        return; 
      }
    } else if (hasActualEnglishLyrics) { 
      lyricsToDownload = searchResult.englishLyrics;
      languageLabel = 'English';
    } else if (hasActualRomanizedLyrics) { 
      lyricsToDownload = searchResult.romanizedLyrics;
      languageLabel = 'Romanized';
    } else {
      return; 
    }

    if (!lyricsToDownload || lyricsToDownload.trim() === "" || lyricsToDownload === "English lyrics not available or not found.") {
        return;
    }
    
    const sanitizedTitle = searchResult.songTitle
      ?.replace(/[^a-z0-9\s-]/gi, '') 
      .replace(/\s+/g, '_') 
      || 'Lyrics';
    
    const filename = `${sanitizedTitle}_Lyrics_(${languageLabel}).txt`;
    const blob = new Blob([lyricsToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const canDownloadCurrentTab = () => {
    if (!searchResult) return false;
    if (activeLyricsTab === 'english') return hasActualEnglishLyrics;
    if (activeLyricsTab === 'romanized') return hasActualRomanizedLyrics;
    return false; 
  };
  
  const isDownloadDisabled = isLoading || !!error || !searchResult || !canDownloadCurrentTab();

  if (!isChatActive && !isLoading) {
    return null;
  }

  if (isLoading && !error) {
    return <LyricsSearchPageSkeleton currentQuery={currentQuery} />;
  }
  
  return (
    <div className="p-4 md:p-6 space-y-6 h-full">
      {error && ( 
        <Card className="border-destructive bg-destructive/10 max-w-2xl mx-auto">
          <CardHeader className="flex-row items-center space-x-3">
             <LucideIcons.AlertTriangle className="w-6 h-6 text-destructive"/>
            <CardTitle className="text-destructive text-xl">Search Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
            <p className="text-xs text-destructive-foreground/80 mt-2">
              Please try a different query, check your connection, or try again later.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && searchResult && ( 
        <div className="space-y-6 animate-fadeIn">
          {searchResult.artistMetadata && (searchResult.artistMetadata.name.toLowerCase() !== 'not available' && searchResult.artistMetadata.name.toLowerCase() !== 'artist name not available') && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <LucideIcons.User className="text-primary h-5 w-5 mt-px flex-shrink-0" />
                  <CardTitle>
                    Artist: {searchResult.artistMetadata.name}
                  </CardTitle>
                </div>
              </CardHeader>
              {searchResult.artistMetadata.bio && searchResult.artistMetadata.bio.toLowerCase() !== 'not available' && (
                <CardContent>
                  <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-md prose prose-sm max-w-none 
                    text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary 
                    prose-strong:text-foreground prose-em:text-muted-foreground prose-blockquote:border-l-primary 
                    prose-code:bg-muted prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-primary">
                     <MarkdownRenderer markdownContent={searchResult.artistMetadata.bio} />
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {(isSongTitleAvailable || isSongDescriptionAvailable) && (
            <Card className="border-0 shadow-lg">
              {isSongTitleAvailable && (
                <CardHeader className={`pb-3 ${isSongDescriptionAvailable ? 'pb-3' : 'pb-6'}`}> 
                    <div className="flex items-center space-x-3">
                        <LucideIcons.Music2 className="text-primary h-5 w-5 mt-px flex-shrink-0" />
                        <CardTitle>
                        Song: {searchResult.songTitle}
                        </CardTitle>
                    </div>
                </CardHeader>
              )}
              {isSongDescriptionAvailable && (
                <CardContent className={`${!isSongTitleAvailable ? 'pt-6' : 'pt-0'} ${isSongTitleAvailable && isSongDescriptionAvailable ? 'pb-6' : ''}`}>
                    <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-md prose prose-sm max-w-none 
                        text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary 
                        prose-strong:text-foreground prose-em:text-muted-foreground prose-blockquote:border-l-primary 
                        prose-code:bg-muted prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-primary">
                        <MarkdownRenderer markdownContent={searchResult.songDescription!} />
                    </div>
                </CardContent>
              )}
            </Card>
          )}


          {showLyricsCard && (
            <Card className="border-0 shadow-lg">
               <CardHeader className="pb-3">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-grow">
                        <LucideIcons.Languages className="text-primary h-5 w-5 flex-shrink-0" /> 
                        <CardTitle className="text-xl">Lyrics</CardTitle>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleDownloadLyrics} 
                        disabled={isDownloadDisabled}
                        aria-label="Download lyrics"
                        title="Download lyrics"
                        className="ml-auto flex-shrink-0"
                    >
                        <LucideIcons.Download className="w-5 h-5" />
                    </Button>
                  </div>
               </CardHeader>
              <CardContent className="py-4">
                {hasActualEnglishLyrics && hasActualRomanizedLyrics && (
                  <div className="mb-4 flex space-x-1 border-b border-border">
                    <Button
                      variant={'ghost'}
                      onClick={() => setActiveLyricsTab('english')}
                      className={`justify-start h-auto pb-2 px-4 rounded-none border-b-2 text-sm font-medium
                                  ${activeLyricsTab === 'english' 
                                    ? 'border-primary text-primary' 
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'}`}
                    >
                      English
                    </Button>
                    <Button
                      variant={'ghost'}
                      onClick={() => setActiveLyricsTab('romanized')}
                      className={`justify-start h-auto pb-2 px-4 rounded-none border-b-2 text-sm font-medium
                                  ${activeLyricsTab === 'romanized' 
                                    ? 'border-primary text-primary' 
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'}`}
                    >
                      Romanized
                    </Button>
                  </div>
                )}

                <div className="bg-muted/30 p-4 rounded-md">
                  {hasActualEnglishLyrics && hasActualRomanizedLyrics && (
                    <>
                      {activeLyricsTab === 'english' && (
                        <MarkdownRenderer markdownContent={formattedEnglishLyrics} className="lyrics-display prose-base" />
                      )}
                      {activeLyricsTab === 'romanized' && (
                        <MarkdownRenderer markdownContent={formattedRomanizedLyrics} className="lyrics-display prose-base" />
                      )}
                    </>
                  )}

                  {!hasActualRomanizedLyrics && showEnglishLyricsSectionWhenNoTabs && (
                    <MarkdownRenderer markdownContent={formattedEnglishLyrics} className="lyrics-display prose-base" />
                  )}
                  
                  {hasActualRomanizedLyrics && !showEnglishLyricsSectionWhenNoTabs && ( 
                    <MarkdownRenderer markdownContent={formattedRomanizedLyrics} className="lyrics-display prose-base" />
                  )}
                </div>
              </CardContent>
            </Card>
          )}
         
          {searchResult.sources && searchResult.sources.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <LucideIcons.Link className="text-primary h-5 w-5 mt-px flex-shrink-0" />
                  <CardTitle>Sources</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {searchResult.sources.map((source, index) => (
                    <li key={index} className="text-sm">
                      <a
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all hover:text-primary/80 transition-colors"
                        aria-label={`Source: ${source.title || source.uri}`}
                      >
                        {source.title || source.uri}
                      </a>
                    </li>
                  ))}
                </ul>
                 <p className="text-xs text-muted-foreground mt-3">
                    Note: These are sources the AI may have consulted. Full content policies apply to the lyrics displayed above.
                  </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!isLoading && !error && !searchResult && isChatActive && ( 
         <div className="text-center text-muted-foreground py-10 h-full flex flex-col justify-center items-center px-4">
            <LucideIcons.Music2 className="w-12 h-12 md:w-16 md:h-16 text-primary mb-4" />
            <p className="text-md md:text-lg">Selected chat is empty.</p>
            <p className="text-xs md:text-sm">Search for lyrics or choose an item from your history.</p>
        </div>
      )}
    </div>
  );
};

export default LyricsSearchPage;