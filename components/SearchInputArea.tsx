import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { SearchHistoryEntry } from '../types';

const LucideIcons = {
  Send: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/></svg>
  ),
  Search: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  )
};

// Fuzzy matching utility
const fuzzyMatch = (term: string, text: string): { isMatch: boolean; indices: number[] } => {
  const termLower = term.toLowerCase();
  const textLower = text.toLowerCase();
  const indices: number[] = [];
  let termIndex = 0;
  let textIndex = 0;

  if (!termLower) return { isMatch: false, indices: [] };

  while (termIndex < termLower.length && textIndex < textLower.length) {
    if (termLower[termIndex] === textLower[textIndex]) {
      indices.push(textIndex);
      termIndex++;
    }
    textIndex++;
  }

  return { isMatch: termIndex === termLower.length, indices };
};

// Component to render text with highlighted characters
const HighlightedText = ({ text, indices }: { text: string; indices: number[] }) => {
    if (!indices || indices.length === 0) {
        return <>{text}</>;
    }
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    indices.forEach((matchIndex) => {
        if (matchIndex > lastIndex) {
            parts.push(text.substring(lastIndex, matchIndex));
        }
        parts.push(<strong className="text-primary" key={matchIndex}>{text[matchIndex]}</strong>);
        lastIndex = matchIndex + 1;
    });

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return <>{React.Children.toArray(parts)}</>;
};


interface SearchInputAreaProps {
  onSearch: (query: string) => void;
  onSelectSuggestion: (query: string) => void;
  isLoading: boolean; 
  isChatActive: boolean;
  initialQuery?: string;
  history: SearchHistoryEntry[];
}

const SearchInputArea: React.FC<SearchInputAreaProps> = ({ 
  onSearch,
  onSelectSuggestion,
  isLoading, 
  isChatActive, 
  initialQuery = '',
  history,
}) => {
  const [inputValue, setInputValue] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<{ entry: SearchHistoryEntry; indices: number[] }[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!isChatActive && inputRef.current && !isLoading) { 
      inputRef.current.focus();
    }
  }, [isChatActive, isLoading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setActiveSuggestionIndex(-1);

    if (value.trim()) {
      const filteredSuggestions = history
        .map(item => ({ entry: item, match: fuzzyMatch(value, item.query) }))
        .filter(({ match }) => match.isMatch) // Show suggestion even if it's an exact match
        .map(({ entry, match }) => ({ entry, indices: match.indices }))
        .slice(0, 5); // Limit to 5 suggestions

      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (query: string) => {
    onSelectSuggestion(query);
    setInputValue(query);
    setShowSuggestions(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => Math.min(prev + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter') {
        if (activeSuggestionIndex > -1) {
          e.preventDefault();
          handleSuggestionClick(suggestions[activeSuggestionIndex].entry.query);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };
  
  const handleFocus = () => {
    if (inputValue.trim()) {
      handleInputChange({ target: { value: inputValue } } as React.ChangeEvent<HTMLInputElement>);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query || isLoading) {
      return;
    }

    // When submitting the form, first check if the input exactly matches a visible suggestion.
    // This allows pressing Enter on a full match to select it instead of re-searching.
    const exactMatch = showSuggestions
      ? suggestions.find(
          (suggestion) => suggestion.entry.query.toLowerCase() === query.toLowerCase()
        )
      : undefined;

    if (exactMatch) {
      // If there's an exact match in the currently shown suggestions, treat it as a selection.
      handleSuggestionClick(exactMatch.entry.query);
    } else {
      // Otherwise, perform a new search.
      onSearch(query);
      setShowSuggestions(false); // Make sure suggestions are hidden on new search
    }
  };

  const placeholderClasses = "placeholder:text-muted-foreground/80";

  if (!isChatActive) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4">
        <div ref={containerRef} className="w-full max-w-lg md:max-w-xl text-center">
           <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-3">Shrimple Lyric</h1>
           <p className="text-muted-foreground mb-8 text-md sm:text-lg">
             Enter a song title, artist, or lyrics snippet to get started.
           </p>
          <div className="relative w-full">
            <form onSubmit={handleSubmit} className="w-full">
              <Input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                placeholder="e.g., 'Bohemian Rhapsody by Queen'"
                className={`h-12 text-base md:h-14 md:text-lg rounded-full shadow-lg bg-card focus-visible:ring-primary/50 ${placeholderClasses} pr-12 sm:pr-14`}
                aria-label="Search for lyrics"
                disabled={isLoading}
                autoComplete="off"
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

            {showSuggestions && suggestions.length > 0 && (
              <ul 
                  className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-xl z-10 text-left overflow-hidden animate-fadeIn"
                  role="listbox"
                  aria-activedescendant={activeSuggestionIndex > -1 ? `suggestion-${activeSuggestionIndex}` : undefined}
              >
                {suggestions.map((suggestion, index) => (
                  <li
                    key={suggestion.entry.id}
                    id={`suggestion-${index}`}
                    role="option"
                    aria-selected={index === activeSuggestionIndex}
                    className={`px-4 py-3 cursor-pointer hover:bg-accent/80 transition-colors duration-100 text-sm sm:text-base ${index === activeSuggestionIndex ? 'bg-accent' : ''}`}
                    onMouseDown={(e) => e.preventDefault()} // Prevents input blur before click
                    onClick={() => handleSuggestionClick(suggestion.entry.query)}
                  >
                    <HighlightedText text={suggestion.entry.query} indices={suggestion.indices} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default SearchInputArea;