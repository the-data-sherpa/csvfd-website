import DOMPurify from 'dompurify';
import './RichTextEditor.css';

export function PageContent({ content }: { content: string }) {
  return (
    <div className="document-editor">
      <div className="document-editor__editable-container">
        <div 
          className="ck ck-content ck-editor__editable ck-rounded-corners ck-editor__editable_inline"
          dangerouslySetInnerHTML={{ 
            __html: DOMPurify.sanitize(content) 
          }}
          style={{
            lineHeight: '1.75',
            marginBottom: '1em',
            whiteSpace: 'normal'
          }}
        />
      </div>
    </div>
  );
}