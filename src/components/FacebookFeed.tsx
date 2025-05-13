import React, { useState, useEffect } from 'react';
import { Loading, Skeleton } from './ui/Loading';

export function FacebookFeed() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleLoad = () => {
      setLoading(false);
    };

    const iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.addEventListener('load', handleLoad);
    }

    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleLoad);
      }
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4 mb-6">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          </div>
        )}
        <iframe 
          src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fcoolspringsvfd&tabs=timeline&width=380&height=600&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false&lazy=true"
          className="absolute inset-0 w-full h-full"
          style={{ 
            border: 'none',
            overflow: 'hidden',
            opacity: loading ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out'
          }}
          scrolling="no"
          frameBorder="0"
          allowTransparency={false}
          title="Cool Springs VFD Facebook Feed"
        />
      </div>
    </div>
  );
}