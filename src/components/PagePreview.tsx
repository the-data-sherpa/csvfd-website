import { Page } from '../types/database';
import { PageContent } from './PageContent';

interface PagePreviewProps {
  page: Partial<Page>;
}

export function PagePreview({ page }: PagePreviewProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
      <PageContent content={page.content || ''} />
    </div>
  );
}