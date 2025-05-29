
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LyricSearchResult } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import LyricsSearchPageSkeleton from '../components/skeletons/LyricsSearchPageSkeleton'; 
import MarkdownRenderer from '../components/MarkdownRenderer';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';

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
  Maximize2: (props: React.SVGProps<SVGSVGElement>) => ( 
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
  ),
  X: (props: React.SVGProps<SVGSVGElement>) => ( 
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  ),
};

interface LyricsSearchPageProps {
  searchResult: LyricSearchResult | null;
  isLoading: boolean;
  error: string | null;
  isChatActive: boolean;
  currentQuery: string | null;
}

type ActiveLyricsTab = 'original' | 'english' | 'romanized';

const formatLyricsForNumberedDisplay = (lyricText?: string): string => {
  if (!lyricText || lyricText.trim() === "" || lyricText.toLowerCase() === "not available" || lyricText.toLowerCase() === "full lyrics restricted") return "";
  return lyricText.split('\n').map(line => `1. ${line}`).join('\n');
};

// Helper function to determine if a language typically uses a Latin-based script
const isLatinBasedScript = (languageName?: string): boolean => {
  if (!languageName) return false;
  const langLower = languageName.toLowerCase();
  const latinBasedLanguages = [
    'english', 'indonesian', 'malay', 'spanish', 'french', 'german', 
    'italian', 'portuguese', 'dutch', 'vietnamese', 'turkish', 'swahili', 
    'filipino', 'tagalog', 'polish', 'swedish', 'norwegian', 'danish', 
    'finnish', 'romanian', 'hungarian', 'czech', 'slovak', 'croatian',
    'slovene', 'latvian', 'lithuanian', 'estonian', 'albanian', 'afrikaans',
    'catalan', 'welsh', 'irish', 'scottish gaelic', 'icelandic', 'maltese',
    // Add more as needed
  ];
  return latinBasedLanguages.some(lbLang => langLower.includes(lbLang));
};


interface FullscreenLyricsViewProps {
  songTitle?: string;
  lyricsContent: string;
  onClose: () => void;
  activeLyricsTab: ActiveLyricsTab;
  originalLanguage?: string; // Kept for potential future use, though not directly in title text now
  hasOriginal: boolean;
  hasEnglish: boolean;
  hasRomanized: boolean;
  canInteract: boolean;
}

const FullscreenLyricsView: React.FC<FullscreenLyricsViewProps> = ({ 
  songTitle, lyricsContent, onClose, activeLyricsTab, originalLanguage,
  hasOriginal, hasEnglish, hasRomanized, canInteract 
}) => {
  const displayTitle = songTitle && songTitle.toLowerCase() !== 'song title not available' ? songTitle : 'Lyrics';
  
  let lyricTypeIndicator = "";
  if (hasOriginal && activeLyricsTab === 'original') {
    lyricTypeIndicator = '(Original)'; // Simplified from showing language
  } else if (hasEnglish && activeLyricsTab === 'english') {
    lyricTypeIndicator = '(English)';
  } else if (hasRomanized && activeLyricsTab === 'romanized') {
    lyricTypeIndicator = '(Romanized)';
  }


  return (
    <div className="fixed inset-0 z-[100] bg-background text-foreground flex flex-col animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="fullscreen-lyrics-title">
      <header className="flex items-center justify-between p-3 sm:p-4 border-b border-border flex-shrink-0">
        <h2 id="fullscreen-lyrics-title" className="text-lg sm:text-xl font-semibold truncate">
          {displayTitle}
          {lyricTypeIndicator && <span className="text-sm font-normal text-muted-foreground ml-2">{lyricTypeIndicator}</span>}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close fullscreen lyrics (Escape key)">
          <LucideIcons.X className="w-6 h-6" />
        </Button>
      </header>
      <ScrollArea className="flex-grow p-4 sm:p-6">
        {!canInteract || !lyricsContent ? (
          <p className="text-muted-foreground text-center py-10 text-base sm:text-lg">
            Lyrics are not available for this selection.
          </p>
        ) : (
          <MarkdownRenderer markdownContent={lyricsContent} className="lyrics-display prose-base sm:prose-lg" />
        )}
      </ScrollArea>
    </div>
  );
};


const LyricsSearchPage: React.FC<LyricsSearchPageProps> = ({
  searchResult,
  isLoading,
  error,
  isChatActive,
  currentQuery
}) => {
  const [activeLyricsTab, setActiveLyricsTab] = useState<ActiveLyricsTab>('original');
  const [isLyricsFullscreen, setIsLyricsFullscreen] = useState(false);

  const hasActualOriginalLyrics = !!searchResult?.originalLyrics && searchResult.originalLyrics.trim() !== "" && searchResult.originalLyrics.toLowerCase() !== "not available" && searchResult.originalLyrics.toLowerCase() !== "full lyrics restricted";
  const hasActualEnglishLyrics = !!searchResult?.englishLyrics && searchResult.englishLyrics.trim() !== "" && searchResult.englishLyrics.toLowerCase() !== "not available" && searchResult.englishLyrics.toLowerCase() !== "english lyrics not available or not found." && searchResult.englishLyrics.toLowerCase() !== "full lyrics restricted";
  const hasActualRomanizedLyrics = !!searchResult?.romanizedLyrics && searchResult.romanizedLyrics.trim() !== "" && searchResult.romanizedLyrics.toLowerCase() !== "not available" && searchResult.romanizedLyrics.toLowerCase() !== "not applicable" && searchResult.romanizedLyrics.toLowerCase() !== "full lyrics restricted";

  const isOriginalLanguageEnglish = !!searchResult?.originalLanguage && searchResult.originalLanguage.toLowerCase() === 'english';
  const isOriginalLanguageLatinBased = isLatinBasedScript(searchResult?.originalLanguage);

  // Determine which tabs to show
  const showOriginalTab = hasActualOriginalLyrics;
  // Show English tab if it has content AND (it's not an English original OR if it is an English original, the English content is different from Original content)
  const showEnglishTab = hasActualEnglishLyrics && 
                         (!isOriginalLanguageEnglish || 
                          (isOriginalLanguageEnglish && searchResult?.englishLyrics !== searchResult?.originalLyrics && hasActualOriginalLyrics) ||
                          (!hasActualOriginalLyrics && isOriginalLanguageEnglish) // Case: Original is English but "Not Available", but English lyrics ARE available
                         );
  // Show Romanized tab if it has content AND the original language is NOT Latin-based (e.g., Korean, Japanese, Russian, Greek etc.)
  const showRomanizedTab = hasActualRomanizedLyrics && !isOriginalLanguageLatinBased;


  const lyricTabsCount = [showOriginalTab, showEnglishTab, showRomanizedTab].filter(Boolean).length;
  const showTabs = lyricTabsCount > 1;

  useEffect(() => {
    // Prioritize Original tab if available
    if (showOriginalTab) {
      setActiveLyricsTab('original');
    } else if (showEnglishTab) { // Then English if Original isn't shown (or doesn't exist)
      setActiveLyricsTab('english');
    } else if (showRomanizedTab) { // Then Romanized if neither Original nor English are shown
      setActiveLyricsTab('romanized');
    } else {
      setActiveLyricsTab('original'); // Fallback, though this state implies no lyrics are available to show
    }
  }, [searchResult, showOriginalTab, showEnglishTab, showRomanizedTab]);


  useEffect(() => {
    if (!isLyricsFullscreen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsLyricsFullscreen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLyricsFullscreen]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (isLyricsFullscreen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = originalOverflow;
    return () => { document.body.style.overflow = originalOverflow; };
  }, [isLyricsFullscreen]);

  const formattedOriginalLyrics = formatLyricsForNumberedDisplay(searchResult?.originalLyrics);
  const formattedEnglishLyrics = formatLyricsForNumberedDisplay(searchResult?.englishLyrics);
  const formattedRomanizedLyrics = formatLyricsForNumberedDisplay(searchResult?.romanizedLyrics);

  const handleDownloadLyrics = () => {
    if (!searchResult) return;

    let lyricsToDownload: string | undefined;
    let languageLabel: string = "Lyrics";
    let originalLangName = searchResult.originalLanguage || "Original";

    if (activeLyricsTab === 'original' && hasActualOriginalLyrics) {
      lyricsToDownload = searchResult.originalLyrics;
      languageLabel = isOriginalLanguageEnglish || isOriginalLanguageLatinBased ? 'Original' : `Original_${originalLangName.replace(/\s+/g, '_')}`;
    } else if (activeLyricsTab === 'english' && hasActualEnglishLyrics) {
      lyricsToDownload = searchResult.englishLyrics;
      languageLabel = 'English';
    } else if (activeLyricsTab === 'romanized' && hasActualRomanizedLyrics && !isOriginalLanguageLatinBased) {
      lyricsToDownload = searchResult.romanizedLyrics;
      languageLabel = 'Romanized';
    } else { // Fallback if active tab has no lyrics or isn't shown, try to find any available based on tab visibility
        if(showOriginalTab && hasActualOriginalLyrics) {
            lyricsToDownload = searchResult.originalLyrics;
            languageLabel = isOriginalLanguageEnglish || isOriginalLanguageLatinBased ? 'Original' : `Original_${originalLangName.replace(/\s+/g, '_')}`;
        } else if (showEnglishTab && hasActualEnglishLyrics) {
            lyricsToDownload = searchResult.englishLyrics;
            languageLabel = 'English';
        } else if (showRomanizedTab && hasActualRomanizedLyrics && !isOriginalLanguageLatinBased) {
            lyricsToDownload = searchResult.romanizedLyrics;
            languageLabel = 'Romanized';
        } else {
            return; // No suitable lyrics to download
        }
    }
    
    if (!lyricsToDownload || lyricsToDownload.trim() === "" || lyricsToDownload.toLowerCase() === "not available" || lyricsToDownload.toLowerCase() === "full lyrics restricted") return;
    
    const sanitizedTitle = searchResult.songTitle?.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_') || 'Lyrics';
    const filename = `${sanitizedTitle}_(${languageLabel}).txt`;
    
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

  const canInteractWithLyrics = useCallback(() => {
    if (!searchResult) return false;
    // Check based on currently active tab and whether it should be shown and has content
    if (activeLyricsTab === 'original' && showOriginalTab && hasActualOriginalLyrics) return true;
    if (activeLyricsTab === 'english' && showEnglishTab && hasActualEnglishLyrics) return true;
    if (activeLyricsTab === 'romanized' && showRomanizedTab && hasActualRomanizedLyrics) return true;
    
    // If current tab isn't "interactable" check if ANY valid tab has lyrics
    if (showOriginalTab && hasActualOriginalLyrics) return true;
    if (showEnglishTab && hasActualEnglishLyrics) return true;
    if (showRomanizedTab && hasActualRomanizedLyrics) return true;

    return false;
  }, [searchResult, activeLyricsTab, hasActualOriginalLyrics, hasActualEnglishLyrics, hasActualRomanizedLyrics, showOriginalTab, showEnglishTab, showRomanizedTab]);
  
  const areLyricActionsDisabled = isLoading || !!error || !searchResult || !canInteractWithLyrics();

  const lyricsCardTitle = useMemo(() => {
    return "Lyrics";
  }, []);

  if (isLyricsFullscreen && searchResult) {
    let lyricsForFullscreen = "";
    if (activeLyricsTab === 'original' && showOriginalTab && hasActualOriginalLyrics) lyricsForFullscreen = formattedOriginalLyrics;
    else if (activeLyricsTab === 'english' && showEnglishTab && hasActualEnglishLyrics) lyricsForFullscreen = formattedEnglishLyrics;
    else if (activeLyricsTab === 'romanized' && showRomanizedTab && hasActualRomanizedLyrics) lyricsForFullscreen = formattedRomanizedLyrics;
    else { // Fallback for fullscreen if active tab somehow has no content but others do
        if (showOriginalTab && hasActualOriginalLyrics) lyricsForFullscreen = formattedOriginalLyrics;
        else if (showEnglishTab && hasActualEnglishLyrics) lyricsForFullscreen = formattedEnglishLyrics;
        else if (showRomanizedTab && hasActualRomanizedLyrics) lyricsForFullscreen = formattedRomanizedLyrics;
    }
    
    return (
      <FullscreenLyricsView
        songTitle={searchResult.songTitle}
        lyricsContent={lyricsForFullscreen}
        onClose={() => setIsLyricsFullscreen(false)}
        activeLyricsTab={activeLyricsTab}
        originalLanguage={searchResult.originalLanguage}
        hasOriginal={showOriginalTab && hasActualOriginalLyrics}
        hasEnglish={showEnglishTab && hasActualEnglishLyrics}
        hasRomanized={showRomanizedTab && hasActualRomanizedLyrics}
        canInteract={canInteractWithLyrics()}
      />
    );
  }

  if (!isChatActive && !isLoading) return null;
  if (isLoading && !error) return <LyricsSearchPageSkeleton currentQuery={currentQuery} />;
  
  const showAnyLyricsCard = (showOriginalTab && hasActualOriginalLyrics) || 
                           (showEnglishTab && hasActualEnglishLyrics) || 
                           (showRomanizedTab && hasActualRomanizedLyrics) ||
                           (searchResult && !hasActualOriginalLyrics && !hasActualEnglishLyrics && !hasActualRomanizedLyrics && 
                            (searchResult.originalLyrics === "Not available" || searchResult.englishLyrics === "English lyrics not available or not found."));


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

          {(searchResult.songTitle && searchResult.songTitle.toLowerCase() !== 'song title not available' || (searchResult.songDescription && searchResult.songDescription.trim() !== "" && searchResult.songDescription.toLowerCase() !== 'not available')) && (
            <Card className="border-0 shadow-lg">
              {searchResult.songTitle && searchResult.songTitle.toLowerCase() !== 'song title not available' && (
                <CardHeader className={`pb-3 ${(searchResult.songDescription && searchResult.songDescription.trim() !== "" && searchResult.songDescription.toLowerCase() !== 'not available') ? 'pb-3' : 'pb-6'}`}> 
                    <div className="flex items-center space-x-3">
                        <LucideIcons.Music2 className="text-primary h-5 w-5 mt-px flex-shrink-0" />
                        <CardTitle>
                        Song: {searchResult.songTitle}
                        </CardTitle>
                    </div>
                </CardHeader>
              )}
              {searchResult.songDescription && searchResult.songDescription.trim() !== "" && searchResult.songDescription.toLowerCase() !== 'not available' && (
                <CardContent className={`${!(searchResult.songTitle && searchResult.songTitle.toLowerCase() !== 'song title not available') ? 'pt-6' : 'pt-0'} ${(searchResult.songTitle && searchResult.songTitle.toLowerCase() !== 'song title not available') && (searchResult.songDescription && searchResult.songDescription.trim() !== "" && searchResult.songDescription.toLowerCase() !== 'not available') ? 'pb-6' : ''}`}>
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

          {showAnyLyricsCard && (
            <Card className="border-0 shadow-lg">
               <CardHeader className="pb-3">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-grow">
                        <LucideIcons.Languages className="text-primary h-5 w-5 flex-shrink-0" /> 
                        <CardTitle className="text-xl">{lyricsCardTitle}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setIsLyricsFullscreen(true)} 
                            disabled={areLyricActionsDisabled}
                            aria-label="Fullscreen lyrics"
                            title="Fullscreen lyrics"
                        >
                            <LucideIcons.Maximize2 className="w-5 h-5" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleDownloadLyrics} 
                            disabled={areLyricActionsDisabled}
                            aria-label="Download lyrics"
                            title="Download lyrics"
                        >
                            <LucideIcons.Download className="w-5 h-5" />
                        </Button>
                    </div>
                  </div>
               </CardHeader>
              <CardContent className="py-4">
                {showTabs && (
                  <div className="mb-4 flex space-x-1 border-b border-border">
                    {showOriginalTab && (
                      <Button
                        variant={'ghost'}
                        onClick={() => setActiveLyricsTab('original')}
                        className={`justify-start h-auto pb-2 px-4 rounded-none border-b-2 text-sm font-medium
                                    ${activeLyricsTab === 'original' 
                                      ? 'border-primary text-primary' 
                                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'}`}
                      >
                        Original
                      </Button>
                    )}
                    {showEnglishTab && (
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
                    )}
                    {showRomanizedTab && ( // This tab's visibility is now conditional on !isOriginalLanguageLatinBased
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
                    )}
                  </div>
                )}

                <div className="bg-muted/30 p-4 rounded-md">
                  {(activeLyricsTab === 'original' && showOriginalTab && hasActualOriginalLyrics) && (
                    <MarkdownRenderer markdownContent={formattedOriginalLyrics} className="lyrics-display prose-base" />
                  )}
                  {(activeLyricsTab === 'english' && showEnglishTab && hasActualEnglishLyrics) && (
                    <MarkdownRenderer markdownContent={formattedEnglishLyrics} className="lyrics-display prose-base" />
                  )}
                  {(activeLyricsTab === 'romanized' && showRomanizedTab && hasActualRomanizedLyrics) && ( // Render only if tab is shown and has content
                    <MarkdownRenderer markdownContent={formattedRomanizedLyrics} className="lyrics-display prose-base" />
                  )}
                  
                  {/* Display logic for when no tabs are shown (single available lyric type) or if active tab has no content */}
                  {!showTabs && showOriginalTab && hasActualOriginalLyrics && (
                     <MarkdownRenderer markdownContent={formattedOriginalLyrics} className="lyrics-display prose-base" />
                  )}
                  {!showTabs && !showOriginalTab && showEnglishTab && hasActualEnglishLyrics && (
                     <MarkdownRenderer markdownContent={formattedEnglishLyrics} className="lyrics-display prose-base" />
                  )}
                  {!showTabs && !showOriginalTab && !showEnglishTab && showRomanizedTab && hasActualRomanizedLyrics && (
                     <MarkdownRenderer markdownContent={formattedRomanizedLyrics} className="lyrics-display prose-base" />
                  )}

                   {/* Fallback message if no lyrics are available to display in any active/shown tab */}
                  {!( (activeLyricsTab === 'original' && showOriginalTab && hasActualOriginalLyrics) ||
                      (activeLyricsTab === 'english' && showEnglishTab && hasActualEnglishLyrics) ||
                      (activeLyricsTab === 'romanized' && showRomanizedTab && hasActualRomanizedLyrics) ||
                      (!showTabs && showOriginalTab && hasActualOriginalLyrics) ||
                      (!showTabs && !showOriginalTab && showEnglishTab && hasActualEnglishLyrics) ||
                      (!showTabs && !showOriginalTab && !showEnglishTab && showRomanizedTab && hasActualRomanizedLyrics)
                    ) && (
                    <p className="text-muted-foreground">Lyrics are not available for this selection or language.</p>
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
