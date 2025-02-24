import React from 'react';
import { Page } from '../types/database';
import createDOMPurifier from 'isomorphic-dompurify';

const DOMPurify = createDOMPurifier(window);

interface PageContentProps {
  page: Page;
}

const sanitizeConfig = {
  ALLOW_ARIA_ATTR: true,
  ALLOW_UNKNOWN_PROTOCOLS: true,
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'u', 's', 'i',
    'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'figure', 'figcaption', 'span',
    'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'class', 'style', 'aria-*',
    'width', 'height', 'align', 'data-alignment', 'aspect-ratio'
  ],
  ALLOWED_CLASSES: {
    'figure': ['image', 'image-style-align-left', 'image-style-align-center', 'image-style-align-right', 'image-style-side'],
    'img': ['image_resized', 'image-style-align-left', 'image-style-align-center', 'image-style-align-right', 'image-inline'],
    'p': ['text-center', 'text-left', 'text-right', 'text-justify'],
    '*': ['text-center', 'text-left', 'text-right', 'text-justify', 'image', 'image_resized', 'image-inline']
  }
};

export function PageContent({ page }: PageContentProps) {
  const cleanContent = DOMPurify.sanitize(page.content, {
    ...sanitizeConfig,
    ADD_ATTR: ['style', 'aria-*'],
    ADD_TAGS: ['style', 'span'],
    KEEP_CONTENT: true,
    SANITIZE_DOM: false,
    USE_PROFILES: {
      html: true,
      svg: false,
      svgFilters: false
    },
    WHOLE_DOCUMENT: false
  });

  return (
    <article className="prose prose-lg max-w-none preview-content">
      <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
      <div className="preview-content ck-content" dangerouslySetInnerHTML={{ __html: cleanContent }} />
    </article>
  );
}