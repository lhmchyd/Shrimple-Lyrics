import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SearchHistoryEntry } from '../types';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

// Manually include lucide-react icons needed for this component
const LucideIcons = {
  Search: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  ),
  Trash2: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
  )
};

interface HistorySearchModalContentProps {
  history: SearchHistoryEntry[];
  selectedQueryId: string | null;
  onSelectHistory: (query: string) => void;
  onDeleteHistoryItem: (id: string) => void;
  onCloseModal: () => void;
}

const HistorySearchModalContent: React.FC<HistorySearchModalContentProps> = ({
  history,
  selectedQueryId,
  onSelectHistory,
  onDeleteHistoryItem,
  onCloseModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Autofocus the input field when the modal opens
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) {
      return history;
    }
    return history.filter(item =>
      item.query.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);

  const handleSelect = (query: string) => {
    onSelectHistory(query);
    onCloseModal();
  };

  return (
    <div className="flex flex-col h-full" style={{ maxHeight: 'calc(80vh - 120px)' /* Approximate card header/footer */ }}>
      <div className="relative mt-2 mb-4"> {/* Added mt-2 for more space above the input */}
        <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search all history..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 text-sm w-full bg-background border-border"
          aria-label="Search history"
        />
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center text-muted-foreground flex-grow flex items-center justify-center">
          {history.length === 0 ? "Your search history is empty." : `No results found for "${searchTerm}".`}
        </div>
      ) : (
        <ScrollArea className="flex-grow min-h-0">
          <ul className="space-y-1 pr-0.5"> {/* Adjusted pr for scrollbar visibility */}
            {filteredHistory.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleSelect(item.query)}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-md flex justify-between items-center
                              transition-colors duration-150 group
                              ${selectedQueryId?.toLowerCase() === item.id.toLowerCase()
                                ? 'bg-accent text-accent-foreground'
                                : 'text-foreground hover:bg-accent/70 hover:text-accent-foreground'
                              }`}
                  title={item.query}
                  aria-current={selectedQueryId?.toLowerCase() === item.id.toLowerCase() ? "page" : undefined}
                >
                  <span className="truncate flex-grow mr-2">{item.query}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground opacity-50 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={(e) => { e.stopPropagation(); onDeleteHistoryItem(item.id); }}
                    aria-label={`Delete search: ${item.query}`}
                  >
                    <LucideIcons.Trash2 className="w-4 h-4" />
                  </Button>
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
};

export default HistorySearchModalContent;