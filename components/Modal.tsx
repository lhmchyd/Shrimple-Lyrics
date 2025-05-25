
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
// ScrollArea is no longer used directly in this component
// import { ScrollArea } from './ui/scroll-area'; 

// Manually include lucide-react icons
const LucideIcons = {
  X: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  )
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string; // Made title optional
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined} // Conditionally set aria-labelledby
    >
      <Card
        className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col bg-card border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside card
      >
        {/* Conditionally render CardHeader */}
        {title && (
          <CardHeader
            className="border-b border-border px-6 py-4" 
          >
            <div className="flex flex-row items-center justify-between w-full">
              <CardTitle id="modal-title" className="text-xl text-foreground truncate flex-grow">
                {title}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal" className="flex-shrink-0 ml-4">
                <LucideIcons.X className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </CardHeader>
        )}
        {/* 
          CardContent is now the direct flex-grow item and handles its own scrolling.
          It will take up the remaining vertical space in the Card after the CardHeader.
        */}
        <CardContent className={`flex-grow min-h-0 overflow-y-auto text-sm text-muted-foreground ${title ? 'py-6' : 'px-6 pb-6 pt-8'}`}> {/* Adjust padding if no title */}
          {children}
        </CardContent>
      </Card>
    </div>
  );
};

export default Modal;