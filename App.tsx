
import React, { useState, useEffect, useCallback } from 'react';
import LyricsSearchPage from './pages/LyricsSearchPage';
import HistorySidebar from './components/HistorySidebar';
import SearchInputArea from './components/SearchInputArea';
import Footer from './components/Footer'; // Import Footer
import { LyricSearchResult, SearchHistoryEntry } from './types';
import { searchLyrics } from './services/geminiService';
import * as idbService from './services/indexedDBService';
import useLocalStorage from './hooks/useLocalStorage';
import Modal from './components/Modal';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';

const App: React.FC = () => {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [activeSearchResult, setActiveSearchResult] = useState<LyricSearchResult | null>(null);
  const [searchInput, setSearchInput] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage<boolean>('sidebarCollapsed', false);

  // State for Edit Modal
  const [editingItem, setEditingItem] = useState<SearchHistoryEntry | null>(null);
  const [newQueryTitle, setNewQueryTitle] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isChatActive = !!selectedQuery || !!activeSearchResult;

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
    setActiveSearchResult(null); // Clear previous result immediately
    setSelectedQuery(query); 
    setSearchInput(query); // Update input field when a history item is selected or new search

    try {
      let result: LyricSearchResult | null = null;
      // Only check cache if it's not a fresh search from the input bar (i.e., it's a history selection)
      if (!isNewSearchFromInput) {
        result = await idbService.getCachedSearchResult(query);
      }

      if (result) {
        setActiveSearchResult(result);
      } else {
        result = await searchLyrics(query);
        setActiveSearchResult(result);
        await idbService.saveSearchResult(query, result);
        // Add to history only if it was a new search or cache miss leading to API call
        // This prevents re-adding on every history click if data is already cached.
        // However, addSearchHistory in idbService uses 'put', so it updates timestamp if exists.
        // For now, let's always call it to update timestamp.
        await idbService.addSearchHistory(query); 
        await loadHistory(); // Refresh history to reflect new/updated item
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      console.error("Lyrics search error:", err);
    } finally {
      setIsLoading(false);
      if (isNewSearchFromInput) setSearchInput(''); // Clear input only if it was a direct typed search
    }
  }, [loadHistory]);


  const handleSearchSubmit = useCallback((query: string) => {
    fetchAndDisplayLyrics(query, true);
  }, [fetchAndDisplayLyrics]);

  const handleSelectHistory = useCallback((query: string) => {
    fetchAndDisplayLyrics(query, false);
  }, [fetchAndDisplayLyrics]);

  const handleDeleteHistoryItem = useCallback(async (id: string) => {
    try {
      await idbService.deleteSearchHistoryItem(id);
      await loadHistory();
      // If the deleted item was the active one, clear the view
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
  }, []);
  
  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, [setIsSidebarCollapsed]);

  // Edit Modal Handlers
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
        // Re-select the item with its new query to refresh the view
        // This will also update activeSearchResult via fetchAndDisplayLyrics
        await fetchAndDisplayLyrics(newQuery, false);
      }
    } catch (err) {
      console.error("Failed to update history item:", err);
      setError("Could not update search title.");
    } finally {
      handleCloseEditModal();
    }
  };


  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground">
      {/* Main content area (Sidebar + Lyrics Page + Search Input) */}
      <div className="flex flex-1 overflow-hidden">
        <div 
          className={`
            ${isSidebarCollapsed ? 'w-[72px] p-3' : 'w-56 md:w-64 p-4'} 
            flex-shrink-0 bg-muted/30 flex flex-col h-full border-r border-border 
            transition-all duration-300 ease-in-out
          `}
        >
          <HistorySidebar
            history={history}
            selectedQueryId={selectedQuery}
            onSelectHistory={handleSelectHistory}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onNewSearch={handleNewSearchClick}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            onOpenEditModal={handleOpenEditModal} // Pass edit handler
          />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-0 relative">
            <LyricsSearchPage
              searchResult={activeSearchResult}
              isLoading={isLoading && isChatActive} // Only show main loading if chat is active
              error={error}
              isChatActive={isChatActive}
              currentQuery={selectedQuery}
            />
          </main>
           <SearchInputArea
              onSearch={handleSearchSubmit}
              isLoading={isLoading} // Pass general loading state for the input's button
              isChatActive={isChatActive}
              initialQuery={searchInput} 
            />
        </div>
      </div>
      {/* Persistent Footer */}
      <Footer />

      {/* Edit Search Title Modal - title and input label removed */}
      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal}>
        <div className="space-y-4">
          <Input
            id="edit-search-title-input"
            value={newQueryTitle}
            onChange={(e) => setNewQueryTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission if any
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
    </div>
  );
};

export default App;
