import React from 'react';

export function FacebookFeed() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 relative">
        <iframe 
          src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fcoolspringsvfd&tabs=timeline&width=380&height=600&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false&lazy=true"
          className="absolute inset-0 w-full h-full"
          style={{ 
            border: 'none',
            overflow: 'hidden'
          }}
          scrolling="no"
          frameBorder="0"
          allowtransparency="true"
          title="Cool Springs VFD Facebook Feed"
        />
      </div>
    </div>
  );
}