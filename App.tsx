
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import LyricsSearchPage from './pages/LyricsSearchPage';
import HistorySidebar from './components/HistorySidebar';
import SearchInputArea from './components/SearchInputArea';
import Footer from './components/Footer';
import { LyricSearchResult, SearchHistoryEntry } from './types';
import { searchLyrics } from './services/geminiService';
import * as idbService from './services/indexedDBService';
import useLocalStorage from './hooks/useLocalStorage';
import Modal from './components/Modal';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';

const CALL_COOLDOWN_SECONDS = 30;
const MAX_CALLS_PER_HOUR = 5;
const ONE_HOUR_MILLISECONDS = 60 * 60 * 1000;
const MOBILE_BREAKPOINT = 768; // md breakpoint in Tailwind

// Manually include lucide-react icons
const LucideIcons = {
  Menu: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
  ),
};

const formatTime = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return "0 seconds";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  let parts = [];
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (seconds > 0 || minutes === 0) parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
  return parts.join(' and ');
};

const App: React.FC = () => {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [activeSearchResult, setActiveSearchResult] = useState<LyricSearchResult | null>(null);
  const [searchInput, setSearchInput] = useState('');
  
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState<string | null>(null); 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage<boolean>('sidebarCollapsed', false);

  const [editingItem, setEditingItem] = useState<SearchHistoryEntry | null>(null);
  const [newQueryTitle, setNewQueryTitle] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [lastApiCallTimeMs, setLastApiCallTimeMs] = useLocalStorage<number | null>('lastApiCallTimeMs', null);
  const [apiCallTimestampsInHour, setApiCallTimestampsInHour] = useLocalStorage<number[]>('apiCallTimestampsInHour', []);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [isInternallyRateLimited, setIsInternallyRateLimited] = useState<boolean>(false);

  const [isMobileView, setIsMobileView] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const isChatActive = !!selectedQuery || !!activeSearchResult;

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobileView(mobile);
      if (!mobile && isMobileSidebarOpen) { // Close mobile sidebar if resizing to desktop
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    const updateRateLimitStatus = () => {
      const now = Date.now();
      let message: string | null = null;
      let limited = false;

      const timeSinceLastCallS = lastApiCallTimeMs ? (now - lastApiCallTimeMs) / 1000 : CALL_COOLDOWN_SECONDS + 1;
      const remainingCooldownS = Math.max(0, Math.ceil(CALL_COOLDOWN_SECONDS - timeSinceLastCallS));

      if (remainingCooldownS > 0) {
        message = `Please wait ${remainingCooldownS} second${remainingCooldownS !== 1 ? 's' : ''} before trying again.`;
        limited = true;
      } else {
        const oneHourAgo = now - ONE_HOUR_MILLISECONDS;
        const currentValidTimestamps = apiCallTimestampsInHour.filter(ts => ts > oneHourAgo);
        if (currentValidTimestamps.length !== apiCallTimestampsInHour.length) {
          setApiCallTimestampsInHour(currentValidTimestamps);
        }

        if (currentValidTimestamps.length >= MAX_CALLS_PER_HOUR) {
          const oldestCallTs = currentValidTimestamps.length > 0 ? currentValidTimestamps[0] : now;
          const resetTimeMs = oldestCallTs + ONE_HOUR_MILLISECONDS;
          const remainingQuotaResetS = Math.max(0, Math.ceil((resetTimeMs - now) / 1000));
          
          if (remainingQuotaResetS > 0) {
             message = `Hourly limit reached. Try again in ${formatTime(remainingQuotaResetS)}.`;
             limited = true;
          } else {
             const refreshedTimestamps = apiCallTimestampsInHour.filter(ts => ts > oneHourAgo);
             if (refreshedTimestamps.length < MAX_CALLS_PER_HOUR) {
                 limited = false;
             } else if (refreshedTimestamps.length > 0) { 
                const newOldestCallTs = refreshedTimestamps[0];
                const newResetTimeMs = newOldestCallTs + ONE_HOUR_MILLISECONDS;
                const newRemainingQuotaResetS = Math.max(0, Math.ceil((newResetTimeMs - now) / 1000));
                if (newRemainingQuotaResetS > 0) {
                    message = `Hourly limit reached. Try again in ${formatTime(newRemainingQuotaResetS)}.`;
                    limited = true;
                } else {
                    limited = false; 
                }
             }
          }
        }
      }
      setRateLimitMessage(message);
      setIsInternallyRateLimited(limited);
    };

    updateRateLimitStatus();
    const intervalId = setInterval(updateRateLimitStatus, 1000); 

    return () => clearInterval(intervalId); 
  }, [lastApiCallTimeMs, apiCallTimestampsInHour, setApiCallTimestampsInHour]);


  const loadHistory = useCallback(async () => {
    try {
      const historyItems = await idbService.getSearchHistory();
      setHistory(historyItems);
    } catch (err) {
      console.error("Failed to load search history:", err);
      setError("Could not load search history.");
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const fetchAndDisplayLyrics = useCallback(async (query: string, isNewSearchFromInput: boolean) => {
    setIsLoading(true);
    setError(null); 
    setActiveSearchResult(null); 
    setSelectedQuery(query); 
    setSearchInput(query); 

    if (isMobileView && isMobileSidebarOpen) setIsMobileSidebarOpen(false);

    try {
      let result: LyricSearchResult | null = null;
      if (!isNewSearchFromInput) {
        result = await idbService.getCachedSearchResult(query);
      }

      if (result) { 
        setActiveSearchResult(result);
      } else { 
        result = await searchLyrics(query); 
        setActiveSearchResult(result);

        const successfulApiCallTime = Date.now();
        setLastApiCallTimeMs(successfulApiCallTime);
        setApiCallTimestampsInHour(prevTimestamps => {
          const oneHourAgo = successfulApiCallTime - ONE_HOUR_MILLISECONDS;
          const validRecentTimestamps = prevTimestamps.filter(ts => ts > oneHourAgo);
          return [...validRecentTimestamps, successfulApiCallTime];
        });
        
        await idbService.saveSearchResult(query, result);
        await idbService.addSearchHistory(query); 
        await loadHistory(); 
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage); 
      console.error("Lyrics search error:", err);
    } finally {
      setIsLoading(false);
      if (isNewSearchFromInput) setSearchInput('');
    }
  }, [loadHistory, setLastApiCallTimeMs, setApiCallTimestampsInHour, isMobileView, isMobileSidebarOpen]);


  const handleSearchSubmit = useCallback((query: string) => {
    const now = Date.now();
    let isCurrentlyLimited = false;

    const timeSinceLastCallS = lastApiCallTimeMs ? (now - lastApiCallTimeMs) / 1000 : CALL_COOLDOWN_SECONDS + 1;
    if (Math.max(0, Math.ceil(CALL_COOLDOWN_SECONDS - timeSinceLastCallS)) > 0) {
      isCurrentlyLimited = true;
    } else {
      const oneHourAgo = now - ONE_HOUR_MILLISECONDS;
      const currentValidTimestamps = apiCallTimestampsInHour.filter(ts => ts > oneHourAgo);
      if (currentValidTimestamps.length >= MAX_CALLS_PER_HOUR) {
        const oldestCallTs = currentValidTimestamps.length > 0 ? currentValidTimestamps[0] : now;
        const resetTimeMs = oldestCallTs + ONE_HOUR_MILLISECONDS;
        if (Math.max(0, Math.ceil((resetTimeMs - now) / 1000)) > 0) {
           isCurrentlyLimited = true;
        }
      }
    }
    
    if (isCurrentlyLimited) {
      return; 
    }
    setError(null);
    fetchAndDisplayLyrics(query, true);
  }, [fetchAndDisplayLyrics, lastApiCallTimeMs, apiCallTimestampsInHour]);

  const handleSelectHistory = useCallback((query: string) => {
    setError(null);
    fetchAndDisplayLyrics(query, false);
  }, [fetchAndDisplayLyrics]);

  const handleDeleteHistoryItem = useCallback(async (id: string) => {
    try {
      await idbService.deleteSearchHistoryItem(id);
      await loadHistory();
      if (selectedQuery?.toLowerCase() === id.toLowerCase()) { 
        setSelectedQuery(null);
        setActiveSearchResult(null);
        setSearchInput('');
      }
    } catch (err) {
      console.error("Failed to delete history item:", err);
      setError("Could not delete history item.");
    }
  }, [loadHistory, selectedQuery]);

  const handleNewSearchClick = useCallback(() => {
    setSelectedQuery(null);
    setActiveSearchResult(null);
    setError(null);
    setSearchInput('');
    if (isMobileView && isMobileSidebarOpen) setIsMobileSidebarOpen(false);
  }, [isMobileView, isMobileSidebarOpen]);
  
  const toggleSidebar = useCallback(() => { // This is for DESKTOP sidebar
    setIsSidebarCollapsed(prev => !prev);
  }, [setIsSidebarCollapsed]);

  const handleOpenEditModal = (item: SearchHistoryEntry) => {
    setEditingItem(item);
    setNewQueryTitle(item.query);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingItem(null);
    setNewQueryTitle('');
  };

  const handleSaveEditedHistoryItem = async () => {
    if (!editingItem || !newQueryTitle.trim() || newQueryTitle.trim() === editingItem.query) {
      handleCloseEditModal();
      return;
    }
    const oldQuery = editingItem.query;
    const newQuery = newQueryTitle.trim();
    try {
      await idbService.updateSearchHistoryItemQuery(oldQuery, newQuery);
      await loadHistory(); 
      if (selectedQuery === oldQuery) {
        await fetchAndDisplayLyrics(newQuery, false);
      }
    } catch (err) {
      console.error("Failed to update history item:", err);
      setError("Could not update search title.");
    } finally {
      handleCloseEditModal();
    }
  };

  const isSearchActionDisabled = useMemo(() => isLoading || isInternallyRateLimited, [isLoading, isInternallyRateLimited]);

  const MobileHeader = () => (
    <header className="fixed top-0 left-0 right-0 h-14 bg-background/80 backdrop-blur-sm border-b border-border z-20 flex items-center px-4 md:hidden">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsMobileSidebarOpen(true)} 
        aria-label="Open navigation menu"
        className="mr-2"
      >
        <LucideIcons.Menu className="w-6 h-6" />
      </Button>
      <h1 className="text-lg font-semibold text-foreground truncate">Shrimple Lyric</h1>
    </header>
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground">
      {isMobileView && <MobileHeader />}
      <div className={`flex flex-1 overflow-hidden ${isMobileView ? 'pt-14' : ''}`}>
        <HistorySidebar
          history={history}
          selectedQueryId={selectedQuery}
          onSelectHistory={handleSelectHistory}
          onDeleteHistoryItem={handleDeleteHistoryItem}
          onNewSearch={handleNewSearchClick}
          isCollapsed={isSidebarCollapsed} // For desktop
          onToggleCollapse={toggleSidebar} // For desktop
          onOpenEditModal={handleOpenEditModal}
          isMobileView={isMobileView}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-0 relative">
            <LyricsSearchPage
              searchResult={activeSearchResult}
              isLoading={isLoading && isChatActive} 
              error={error}
              isChatActive={isChatActive}
              currentQuery={selectedQuery}
            />
          </main>
           <SearchInputArea
              onSearch={handleSearchSubmit}
              isLoading={isSearchActionDisabled} 
              isChatActive={isChatActive}
              initialQuery={searchInput} 
              rateLimitMessage={isChatActive ? null : rateLimitMessage}
            />
        </div>
      </div>
      <Footer />
      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal}>
        <div className="space-y-4">
          <Input
            id="edit-search-title-input"
            value={newQueryTitle}
            onChange={(e) => setNewQueryTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveEditedHistoryItem();
              }
            }}
            placeholder="Enter new title"
            autoFocus
            className="text-sm"
          />
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" onClick={handleCloseEditModal} size="sm">
              Cancel
            </Button>
            <Button onClick={handleSaveEditedHistoryItem} size="sm">
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {isChatActive && rateLimitMessage && (
        <div 
          className={`fixed left-1/2 -translate-x-1/2 z-[60] 
                     bg-destructive text-destructive-foreground 
                     px-4 py-2 rounded-md shadow-lg text-xs animate-fadeIn
                     ${isMobileView ? 'top-[4.25rem]' : 'top-4'}`} // Adjust top for mobile header
          role="alert"
          aria-live="assertive"
        >
          {rateLimitMessage}
        </div>
      )}
    </div>
  );
};

export default App;