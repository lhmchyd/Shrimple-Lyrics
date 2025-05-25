import React from 'react';

interface SkeletonPlaceholderProps {
  className?: string;
}

const SkeletonPlaceholder: React.FC<SkeletonPlaceholderProps> = ({ className }) => {
  return (
    <div className={`bg-muted animate-pulse rounded ${className || ''}`} />
  );
};

export default SkeletonPlaceholder;
