import React from 'react';
import { Page } from '../types/database';
import DOMPurify from 'isomorphic-dompurify';

interface PagePreviewProps {
  page: Partial<Page>;
}

const sanitizeConfig = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'u', 's',
    'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'class', 'style',
    'width', 'height', 'align', 'data-alignment', 'aspect-ratio'
  ],
  ALLOWED_CLASSES: {
    'figure': ['image', 'image', 'image-style-align-left', 'image-style-align-center', 'image-style-align-right'],
    'img': ['image_resized', 'image-style-align-left', 'image-style-align-center', 'image-style-align-right', 'image-inline'],
    'p': ['text-center', 'text-left', 'text-right', 'text-justify'],
    '*': ['text-center', 'text-left', 'text-right', 'text-justify', 'image', 'image_resized', 'image-inline']
  }
};

export function PagePreview({ page }: PagePreviewProps) {
  const cleanContent = DOMPurify.sanitize(page.content || '', {
    ...sanitizeConfig,
    ADD_ATTR: ['style'],
    ADD_TAGS: ['style'],
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
        <div 
          className="prose prose-lg max-w-none preview-content ck-content"
          dangerouslySetInnerHTML={{ __html: cleanContent }}
        />
      </div>
    </div>
  );
}