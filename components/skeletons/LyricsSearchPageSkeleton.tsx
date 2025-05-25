
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import SkeletonPlaceholder from './SkeletonPlaceholder';

interface LyricsSearchPageSkeletonProps {
  currentQuery: string | null;
}

const LyricsSearchPageSkeleton: React.FC<LyricsSearchPageSkeletonProps> = ({ currentQuery }) => {
  return (
    <div className="p-4 md:p-6 space-y-6 h-full animate-fadeIn">
      {currentQuery && (
        <div className="text-center mb-4 py-4">
          <SkeletonPlaceholder className="h-5 w-3/4 sm:w-1/2 mx-auto" /> {/* For "Searching for 'query'..." text */}
        </div>
      )}

      {/* Artist Card Skeleton */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3 mb-2">
            <SkeletonPlaceholder className="h-5 w-5 rounded-full flex-shrink-0" /> 
            <SkeletonPlaceholder className="h-5 w-24" /> 
          </div>
          <SkeletonPlaceholder className="h-5 w-1/2" /> 
        </CardHeader>
        <CardContent>
          <div className="space-y-2 bg-muted/30 p-4 rounded-md">
            <SkeletonPlaceholder className="h-4 w-full" />
            <SkeletonPlaceholder className="h-4 w-5/6" />
            <SkeletonPlaceholder className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>

      {/* Song Title & Description Card Skeleton */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3 mb-2">
            <SkeletonPlaceholder className="h-5 w-5 rounded-full flex-shrink-0" />
            <SkeletonPlaceholder className="h-5 w-20" /> 
          </div>
           <SkeletonPlaceholder className="h-5 w-3/4" /> 
        </CardHeader>
        <CardContent>
          <div className="space-y-2 bg-muted/30 p-4 rounded-md">
            <SkeletonPlaceholder className="h-4 w-full" />
            <SkeletonPlaceholder className="h-4 w-5/6" />
          </div>
        </CardContent>
      </Card>

      {/* Lyrics Card Skeleton */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-grow">
              <SkeletonPlaceholder className="h-5 w-5 rounded-full flex-shrink-0" />
              <SkeletonPlaceholder className="h-6 w-1/4" /> {/* "Lyrics" */}
            </div>
            <SkeletonPlaceholder className="h-8 w-8 rounded-md flex-shrink-0" /> {/* Download button */}
          </div>
        </CardHeader>
        <CardContent className="py-4">
          <div className="mb-4 flex space-x-2 border-b border-border">
            <SkeletonPlaceholder className="h-8 w-20 py-1" /> {/* Tab 1 */}
            <SkeletonPlaceholder className="h-8 w-20 py-1" /> {/* Tab 2 */}
          </div>
          <div className="bg-muted/30 p-4 rounded-md space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center">
                <SkeletonPlaceholder className="h-4 w-8 mr-4 flex-shrink-0" /> {/* Line number */}
                <SkeletonPlaceholder className={`h-4 ${i % 3 === 0 ? 'w-full' : (i % 3 === 1 ? 'w-11/12' : 'w-5/6')}`} /> {/* Lyric line */}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sources Card Skeleton */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <SkeletonPlaceholder className="h-5 w-5 rounded-full flex-shrink-0" />
            <SkeletonPlaceholder className="h-5 w-1/5" /> {/* "Sources" */}
          </div>
        </CardHeader>
        <CardContent className="pt-2 space-y-2">
          <SkeletonPlaceholder className="h-4 w-full" />
          <SkeletonPlaceholder className="h-4 w-11/12" />
          <SkeletonPlaceholder className="h-4 w-5/6" />
        </CardContent>
      </Card>
    </div>
  );
};

export default LyricsSearchPageSkeleton;