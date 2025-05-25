
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  markdownContent: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ markdownContent, className }) => {
  return (
    <div className={`prose max-w-none 
                    text-foreground 
                    prose-headings:text-foreground 
                    prose-p:text-muted-foreground prose-p:mb-5 
                    prose-a:text-primary hover:prose-a:text-primary/80 
                    prose-strong:text-foreground 
                    prose-em:text-muted-foreground 
                    prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:pl-4 
                    prose-code:bg-muted prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-sm 
                    prose-pre:bg-muted/70 prose-pre:text-foreground prose-pre:p-4 prose-pre:rounded-md 
                    prose-ul:list-disc prose-ol:list-decimal 
                    prose-li:marker:text-primary
                    ${className || ''}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {markdownContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;