import React, { useRef, useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import Editor from '@ckeditor/ckeditor5-build-decoupled-document';
import './RichTextEditor.css';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editorHeight, setEditorHeight] = useState(600);
  const startHeightRef = useRef(0);
  const startYRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startHeightRef.current = editorHeight;
    startYRef.current = e.clientY;
    document.body.style.cursor = 'row-resize';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientY - startYRef.current;
    const newHeight = Math.max(300, startHeightRef.current + delta);
    setEditorHeight(newHeight);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = '';
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="document-editor" style={{ height: editorHeight }}>
      <div ref={toolbarRef} className="document-editor__toolbar"></div>
      <div className="document-editor__editable-container">
      <CKEditor
        onReady={(editor) => {
          if (toolbarRef.current && editor.ui.getEditableElement()) {
            const view = editor.ui.view as any;
            toolbarRef.current.appendChild(view.toolbar.element);
            const editableElement = editor.ui.getEditableElement()!;
            editableElement.classList.add('document-editor__editable');
            
            // Force our styles to take precedence
            const root = editor.editing.view.document.getRoot()!;
            editor.editing.view.change(writer => {
              writer.setStyle({
                'white-space': 'normal',
                'line-height': '1.75',
                'margin-bottom': '1em'
              }, root);
            });
          }
        }}
        onChange={(_, editor) => {
          const data = editor.getData();
          onChange(data);
        }}
        editor={Editor as any}
        data={content}
        config={{
          htmlSupport: {
            allow: [
              {
                name: /.*/,
                attributes: true,
                classes: true,
                styles: true
              }
            ]
          },
          enterMode: 'P',
          shiftEnterMode: 'BR',
          typing: {
            transformations: {
              remove: [
                'symbols', 'quotes', 'typography', 'whitespace'
              ]
            }
          },
          enter: {
            options: {
              tags: ['p'],
              attributes: [
                {
                  name: 'style',
                  value: {
                    'white-space': 'normal',
                    'line-height': '1.75',
                    'margin-bottom': '1em'
                  }
                }
              ]
            }
          },
          heading: {
            options: [
              { 
                model: 'paragraph', 
                title: 'Paragraph', 
                class: 'ck-heading_paragraph'
              },
              {
                model: 'heading1',
                view: {
                  name: 'h1',
                  classes: 'text-4xl font-bold mb-6'
                },
                title: 'Heading 1',
                class: 'ck-heading_heading1'
              },
              {
                model: 'heading2',
                view: {
                  name: 'h2',
                  classes: 'text-3xl font-bold mb-5'
                },
                title: 'Heading 2',
                class: 'ck-heading_heading2'
              },
              {
                model: 'heading3',
                view: {
                  name: 'h3',
                  classes: 'text-2xl font-bold mb-4'
                },
                title: 'Heading 3',
                class: 'ck-heading_heading3'
              }
            ]
          },
          removePlugins: ['Title'],
          removeFormatAttributes: false,
          format_tags: 'p;h1;h2;h3;pre',
          toolbar: {
            items: [
              'selectAll',
              'heading',
              '|',
              'alignment',
              '|',
              'imageUpload',
              'imageStyle:alignLeft',
              'imageStyle:alignCenter',
              'imageStyle:alignRight',
              '|',
              'fontSize',
              'fontFamily',
              '|',
              'bold',
              'italic',
              'underline',
              'strikethrough',
              '|',
              'numberedList',
              'bulletedList',
              '|',
              'outdent',
              'indent',
              '|',
              'link',
              'blockQuote',
              'insertTable',
              'mediaEmbed',
              '|',
              'undo',
              'redo'
            ],
            shouldNotGroupWhenFull: true
          },
          image: {
            toolbar: [
              'imageStyle:inline',
              'imageStyle:block',
              'imageStyle:alignLeft',
              'imageStyle:alignCenter',
              'imageStyle:alignRight',
              '|',
              'imageTextAlternative'
            ],
            styles: {
              options: [
                'inline',
                'block',
                { 
                  name: 'alignLeft',
                  className: 'image-style-align-left',
                },
                { 
                  name: 'alignCenter',
                  className: 'image-style-align-center',
                },
                { 
                  name: 'alignRight',
                  className: 'image-style-align-right',
                }
              ]
            },
            resizeUnit: '%',
            resizeOptions: [ 
              {
                name: 'resizeImage:original',
                value: null,
                icon: 'original'
              },
              {
                name: 'resizeImage:50',
                value: '50',
                icon: 'medium'
              },
              {
                name: 'resizeImage:75',
                value: '75',
                icon: 'large'
              }
            ]
          },
          table: {
            contentToolbar: [
              'tableColumn',
              'tableRow',
              'mergeTableCells',
              'tableCellProperties',
              'tableProperties'
            ]
          }
        } as any}
      />
      </div>
      <div 
        className="document-editor__resize-handle"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}