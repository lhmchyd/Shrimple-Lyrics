
import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';

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
  isChatActive: boolean;
  initialQuery?: string;
  rateLimitMessage?: string | null; 
}

const SearchInputArea: React.FC<SearchInputAreaProps> = ({ 
  onSearch, 
  isLoading, 
  isChatActive, 
  initialQuery = '',
  rateLimitMessage 
}) => {
  const [inputValue, setInputValue] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!isChatActive && inputRef.current && !isLoading) { 
      inputRef.current.focus();
    }
  }, [isChatActive, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) { 
      onSearch(inputValue.trim());
    }
  };

  const placeholderClasses = "placeholder:text-muted-foreground/80";
  const rateLimitMessageClasses = "text-xs text-destructive text-center pt-2 h-6";

  if (!isChatActive) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4">
        <div className="w-full max-w-lg md:max-w-xl text-center">
           <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-3">Shrimple Lyric</h1>
           <p className="text-muted-foreground mb-8 text-md sm:text-lg">
             Enter a song title, artist, or lyrics snippet to get started.
           </p>
          <form onSubmit={handleSubmit} className="relative w-full">
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g., 'Bohemian Rhapsody by Queen'"
              className={`h-12 text-base md:h-14 md:text-lg rounded-full shadow-lg bg-card focus-visible:ring-primary/50 ${placeholderClasses} pr-12 sm:pr-14`}
              aria-label="Search for lyrics"
              disabled={isLoading} 
            />
            <Button 
              type="submit" 
              size="icon" 
              className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary hover:bg-primary/90 absolute top-1/2 -translate-y-1/2 right-1.5 sm:right-2`} 
              isLoading={isLoading}
              aria-label="Search"
              disabled={isLoading} 
            >
              {!isLoading && <LucideIcons.Search className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
          </form>
          {rateLimitMessage && <div className={`${rateLimitMessageClasses} mt-2`}>{rateLimitMessage}</div>}
          {!rateLimitMessage && <div className={rateLimitMessageClasses}></div>} 
        </div>
      </div>
    );
  }
  return null;
};

export default SearchInputArea;