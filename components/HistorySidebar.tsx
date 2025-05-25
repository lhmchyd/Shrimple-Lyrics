
import React, { useState, useMemo } from 'react';
import { SearchHistoryEntry } from '../types';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import Modal from './Modal';
import HistorySearchModalContent from './HistorySearchModalContent';

// Manually include lucide-react icons
const LucideIcons = {
  MessageSquarePlus: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM12 7v6"/><path d="M9 10h6"/></svg>
  ),
  Trash2: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
  ),
  Edit3: (props: React.SVGProps<SVGSVGElement>) => ( // Added Edit3 icon
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
  ),
  History: (props: React.SVGProps<SVGSVGElement>) => ( 
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M12 8v4l2 2"/></svg>
  ),
  PanelLeftClose: (props: React.SVGProps<SVGSVGElement>) => ( 
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>
  ),
  PanelRightOpen: (props: React.SVGProps<SVGSVGElement>) => ( 
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/></svg>
  ),
  Search: (props: React.SVGProps<SVGSVGElement>) => ( 
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  )
};


interface HistorySidebarProps {
  history: SearchHistoryEntry[];
  selectedQueryId: string | null;
  onSelectHistory: (query: string) => void;
  onDeleteHistoryItem: (id: string) => void;
  onNewSearch: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenEditModal: (item: SearchHistoryEntry) => void; // Added prop for edit modal
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  history,
  selectedQueryId,
  onSelectHistory,
  onDeleteHistoryItem,
  onNewSearch,
  isCollapsed,
  onToggleCollapse,
  onOpenEditModal // Destructure new prop
}) => {
  const [isHistorySearchModalOpen, setIsHistorySearchModalOpen] = useState(false);

  return (
    <>
      <aside className="flex flex-col h-full overflow-hidden">
        {/* Header: Title and Toggle Button */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} pb-3 border-b border-border mb-3 pt-1`}>
          {!isCollapsed && <h2 className="text-lg font-semibold text-foreground truncate pr-2">Shrimple Lyric</h2>}
          <Button 
              onClick={onToggleCollapse} 
              variant="ghost" 
              size="icon" 
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="flex-shrink-0"
          >
            {isCollapsed ? <LucideIcons.PanelRightOpen className="w-5 h-5" /> : <LucideIcons.PanelLeftClose className="w-5 h-5" />}
          </Button>
        </div>

        {/* Action Buttons Section */}
        <div className={`space-y-2 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          {/* New Search Button */}
          <Button 
            onClick={onNewSearch} 
            variant={isCollapsed ? "ghost" : "outline"} 
            size={isCollapsed ? "icon" : "default"}
            className={`w-full ${isCollapsed ? 'h-10 justify-center' : 'justify-start'}`} 
            aria-label={isCollapsed ? "New Search" : undefined}
          >
            <LucideIcons.MessageSquarePlus className={`w-4 h-4 ${!isCollapsed ? 'mr-2' : ''}`} />
            {!isCollapsed && 'New Search'}
          </Button>
          
          {/* Search History Button - Text for expanded, Icon for collapsed */}
          {isCollapsed ? (
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-10 justify-center" 
              onClick={() => setIsHistorySearchModalOpen(true)}
              aria-label="Search History"
            >
              <LucideIcons.Search className="w-4 h-4" /> 
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start text-left py-2 h-10" // Fixed height for consistency
              onClick={() => setIsHistorySearchModalOpen(true)}
            >
              <LucideIcons.Search className="w-4 h-4 mr-2 flex-shrink-0" /> 
              <span className="truncate">Search History</span>
            </Button>
          )}
        </div>
        
        {/* Recent Searches Area (Only when expanded) */}
        {!isCollapsed && (
          <div className="flex-grow overflow-hidden mt-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-foreground flex items-center">
                Recent Searches
              </h2>
            </div>
            <ScrollArea className="flex-grow h-full">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center mt-4 px-2">No search history yet.</p>
              ) : (
                <ul className="space-y-1 pr-1">
                  {history.map((item) => (
                    <li key={item.id} className="group">
                      <button
                        onClick={() => onSelectHistory(item.query)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md truncate flex justify-between items-center
                                    ${selectedQueryId?.toLowerCase() === item.id.toLowerCase()
                                      ? 'bg-accent text-accent-foreground hover:bg-accent/80' 
                                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                                    }`}
                        title={item.query}
                      >
                        <span className="truncate flex-grow mr-2">{item.query}</span>
                        <div className="flex items-center shrink-0">
                          <LucideIcons.Edit3
                            className="w-4 h-4 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                            onClick={(e) => { e.stopPropagation(); onOpenEditModal(item); }}
                            aria-label={`Edit search title: ${item.query}`}
                          />
                          <LucideIcons.Trash2 
                            className="w-4 h-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); onDeleteHistoryItem(item.id); }}
                            aria-label={`Delete search: ${item.query}`}
                          />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </div>
        )}
      </aside>

      <Modal
        isOpen={isHistorySearchModalOpen}
        onClose={() => setIsHistorySearchModalOpen(false)}
        title="Search History"
      >
        <HistorySearchModalContent
          history={history}
          selectedQueryId={selectedQueryId}
          onSelectHistory={onSelectHistory}
          onDeleteHistoryItem={onDeleteHistoryItem}
          onCloseModal={() => setIsHistorySearchModalOpen(false)}
        />
      </Modal>
    </>
  );
};

export default HistorySidebar;
