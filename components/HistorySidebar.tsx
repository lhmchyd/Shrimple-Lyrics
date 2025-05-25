
import React, { useState, useMemo, useEffect } from 'react';
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
  Edit3: (props: React.SVGProps<SVGSVGElement>) => ( 
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
  ),
  X: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  ),
  MoreVertical: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
  ),
};


interface HistorySidebarProps {
  history: SearchHistoryEntry[];
  selectedQueryId: string | null;
  onSelectHistory: (query: string) => void;
  onDeleteHistoryItem: (id: string) => void;
  onNewSearch: () => void;
  isCollapsed: boolean; // For desktop
  onToggleCollapse: () => void; // For desktop
  onOpenEditModal: (item: SearchHistoryEntry) => void;
  isMobileView: boolean;
  isMobileSidebarOpen: boolean;
  onCloseMobileSidebar: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  history,
  selectedQueryId,
  onSelectHistory,
  onDeleteHistoryItem,
  onNewSearch,
  isCollapsed,
  onToggleCollapse,
  onOpenEditModal,
  isMobileView,
  isMobileSidebarOpen,
  onCloseMobileSidebar,
}) => {
  const [isHistorySearchModalOpen, setIsHistorySearchModalOpen] = useState(false);
  const [dropdownOpenForItemId, setDropdownOpenForItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!isMobileSidebarOpen && isMobileView) {
      setDropdownOpenForItemId(null); // Close dropdown if mobile sidebar closes
    }
  }, [isMobileSidebarOpen, isMobileView]);

  const sidebarContent = (isMobileContext: boolean) => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header: Title and Toggle/Close Button */}
      {isMobileContext ? (
        <div className="flex items-center justify-between pb-3 border-b border-border mb-3 pt-1">
          <h2 className="text-lg font-semibold text-foreground truncate pr-2">Menu</h2>
          <Button 
            onClick={onCloseMobileSidebar} 
            variant="ghost" 
            size="icon" 
            aria-label="Close sidebar"
            className="flex-shrink-0"
          >
            <LucideIcons.X className="w-5 h-5" />
          </Button>
        </div>
      ) : (
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
      )}

      {/* Action Buttons Section */}
      <div className={`space-y-2 ${isCollapsed && !isMobileContext ? 'flex flex-col items-center' : ''}`}>
        <Button 
          onClick={onNewSearch} 
          variant={(isCollapsed && !isMobileContext) ? "ghost" : "outline"} 
          size={(isCollapsed && !isMobileContext) ? "icon" : "default"}
          className={`w-full ${(isCollapsed && !isMobileContext) ? 'h-10 justify-center' : 'justify-start'}`} 
          aria-label={(isCollapsed && !isMobileContext) ? "New Search" : undefined}
        >
          <LucideIcons.MessageSquarePlus className={`w-4 h-4 ${(!isCollapsed || isMobileContext) ? 'mr-2' : ''}`} />
          {(!isCollapsed || isMobileContext) && 'New Search'}
        </Button>
        
        {(isCollapsed && !isMobileContext) ? (
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
            className="w-full justify-start text-left py-2 h-10"
            onClick={() => setIsHistorySearchModalOpen(true)}
          >
            <LucideIcons.Search className="w-4 h-4 mr-2 flex-shrink-0" /> 
            <span className="truncate">Search History</span>
          </Button>
        )}
      </div>
      
      {/* Recent Searches Area (Only when expanded on desktop, or always on mobile) */}
      {(!isCollapsed || isMobileContext) && (
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
                  <li key={item.id} className="group relative"> {/* Added relative for dropdown positioning */}
                    <button
                      onClick={() => {
                        onSelectHistory(item.query);
                        setDropdownOpenForItemId(null); // Close dropdown on selection
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md truncate flex justify-between items-center
                                  ${selectedQueryId?.toLowerCase() === item.id.toLowerCase()
                                    ? 'bg-accent text-accent-foreground hover:bg-accent/80' 
                                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                                  }`}
                      title={item.query}
                    >
                      <span className="truncate flex-grow mr-2">{item.query}</span>
                      <div className="flex items-center shrink-0">
                        {isMobileContext ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary focus:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDropdownOpenForItemId(prev => prev === item.id ? null : item.id);
                              }}
                              aria-label={`More options for ${item.query}`}
                              aria-haspopup="true"
                              aria-expanded={dropdownOpenForItemId === item.id}
                            >
                              <LucideIcons.MoreVertical className="w-4 h-4" />
                            </Button>
                            {dropdownOpenForItemId === item.id && (
                              <div 
                                className="absolute right-0 top-full mt-1.5 mr-1 p-1.5 bg-card border border-border rounded-md shadow-xl z-50 w-36 flex flex-col space-y-1"
                                role="menu"
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start px-2 py-1.5 text-sm text-foreground hover:bg-muted"
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onOpenEditModal(item); 
                                    setDropdownOpenForItemId(null); 
                                  }}
                                  role="menuitem"
                                >
                                  <LucideIcons.Edit3 className="w-3.5 h-3.5 mr-2" />
                                  <span>Edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start px-2 py-1.5 text-sm text-destructive hover:text-destructive-foreground hover:bg-destructive/90"
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onDeleteHistoryItem(item.id); 
                                    setDropdownOpenForItemId(null); 
                                  }}
                                  role="menuitem"
                                >
                                  <LucideIcons.Trash2 className="w-3.5 h-3.5 mr-2" />
                                  <span>Delete</span>
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <LucideIcons.Edit3
                              className="w-4 h-4 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity mr-1 cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); onOpenEditModal(item); }}
                              aria-label={`Edit search title: ${item.query}`}
                              tabIndex={0} 
                              role="button"
                            />
                            <LucideIcons.Trash2 
                              className="w-4 h-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); onDeleteHistoryItem(item.id); }}
                              aria-label={`Delete search: ${item.query}`}
                              tabIndex={0} 
                              role="button"
                            />
                          </>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );

  return (
    <>
      {isMobileView ? (
        <>
          {isMobileSidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" // Slightly darker backdrop for better contrast with semi-transparent sidebar
              onClick={() => {
                onCloseMobileSidebar();
                setDropdownOpenForItemId(null); // Close any open dropdown when backdrop is clicked
              }}
              aria-hidden="true"
            />
          )}
          <aside
            className={`fixed inset-y-0 left-0 z-40 w-72 bg-muted/30 border-r border-border p-4
                        transform transition-transform duration-300 ease-in-out md:hidden
                        ${isMobileSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`}
            role="dialog"
            aria-modal={isMobileSidebarOpen ? "true" : "false"}
            aria-labelledby="mobile-sidebar-title" 
          >
            {sidebarContent(true)}
          </aside>
        </>
      ) : (
        <aside 
          className={`
            ${isCollapsed ? 'w-[72px] p-3' : 'w-56 md:w-64 p-4'} 
            flex-shrink-0 bg-muted/30 flex-col h-full border-r border-border 
            transition-all duration-300 ease-in-out hidden md:flex 
          `}
        >
          {sidebarContent(false)}
        </aside>
      )}

      <Modal
        isOpen={isHistorySearchModalOpen}
        onClose={() => setIsHistorySearchModalOpen(false)}
        title="Search History"
      >
        <HistorySearchModalContent
          history={history}
          selectedQueryId={selectedQueryId}
          onSelectHistory={(query) => {
            onSelectHistory(query);
            setDropdownOpenForItemId(null); 
            setIsHistorySearchModalOpen(false); 
          }}
          onDeleteHistoryItem={onDeleteHistoryItem}
          onCloseModal={() => setIsHistorySearchModalOpen(false)}
        />
      </Modal>
    </>
  );
};

export default HistorySidebar;
