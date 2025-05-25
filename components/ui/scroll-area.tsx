
import React from 'react';

// Helper to merge class names - basic version for this environment
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <div className="h-full w-full rounded-[inherit] overflow-y-auto"> {/* Simplified: direct overflow */}
      {children}
    </div>
    {/* Shadcn UI has scrollbar components here, but we use global CSS scrollbar */}
  </div>
));
ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
