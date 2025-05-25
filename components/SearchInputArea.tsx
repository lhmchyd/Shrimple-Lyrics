
import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';

// Manually include lucide-react icons
const LucideIcons = {
  Send: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/></svg>
  ),
  Search: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  )
};

interface SearchInputAreaProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  isChatActive: boolean; // True if results are shown or history is selected
  initialQuery?: string; // To prefill search bar
}

const SearchInputArea: React.FC<SearchInputAreaProps> = ({ onSearch, isLoading, isChatActive, initialQuery = '' }) => {
  const [inputValue, setInputValue] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(initialQuery); // Sync if initialQuery prop changes (e.g., new chat)
  }, [initialQuery]);

  useEffect(() => {
    if (!isChatActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatActive]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSearch(inputValue.trim());
      // Optionally clear input after search: setInputValue('');
    }
  };

  const commonInputClasses = "pr-12 placeholder:text-muted-foreground/80";
  const commonButtonClasses = "absolute right-1 top-1/2 -translate-y-1/2";

  if (!isChatActive) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4">
        <div className="w-full max-w-xl text-center">
           <h1 className="text-5xl font-bold text-primary mb-3">Shrimple Lyric</h1>
           <p className="text-muted-foreground mb-8 text-lg">
             Enter a song title, artist, or lyrics snippet to get started.
           </p>
          <form onSubmit={handleSubmit} className="relative w-full">
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g., 'Bohemian Rhapsody by Queen'"
              className={`h-14 text-lg rounded-full shadow-lg bg-card focus-visible:ring-primary/50 ${commonInputClasses}`}
              aria-label="Search for lyrics"
            />
            <Button 
              type="submit" 
              size="icon" 
              className={`h-10 w-10 rounded-full bg-primary hover:bg-primary/90 ${commonButtonClasses}`} 
              isLoading={isLoading}
              aria-label="Search"
            >
              {!isLoading && <LucideIcons.Search className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border">
      <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask about lyrics or search for a new song..."
          className={`h-12 bg-card shadow-md ${commonInputClasses}`}
          aria-label="Search for lyrics"
        />
        <Button 
          type="submit" 
          size="icon" 
          className={`h-9 w-9 ${commonButtonClasses}`} 
          isLoading={isLoading}
          aria-label="Send search"
        >
         {!isLoading && <LucideIcons.Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
};

export default SearchInputArea;