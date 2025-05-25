
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

// Manually include lucide-react icons
const LucideIcons = {
  X: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  )
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string; 
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
      aria-labelledby={title ? "modal-title" : undefined} 
    >
      <Card
        className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col bg-card border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()} 
      >
        {title && (
          <CardHeader
            className="border-b border-border px-4 sm:px-6 py-4" 
          >
            <div className="flex flex-row items-center justify-between w-full">
              <CardTitle id="modal-title" className="text-lg sm:text-xl text-foreground truncate flex-grow">
                {title}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal" className="flex-shrink-0 ml-2 sm:ml-4">
                <LucideIcons.X className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </CardHeader>
        )}
        <CardContent className={`flex-grow min-h-0 overflow-y-auto text-sm text-muted-foreground 
                                 ${title ? 'px-4 sm:px-6 py-4 sm:py-6' : 'px-4 sm:px-6 pb-4 sm:pb-6 pt-6 sm:pt-8'}`}>
          {children}
        </CardContent>
      </Card>
    </div>
  );
};

export default Modal;