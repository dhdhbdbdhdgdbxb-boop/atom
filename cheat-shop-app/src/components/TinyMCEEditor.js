'use client';

import { useEffect, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { useRouter, usePathname } from 'next/navigation';

export default function TinyMCEEditor({
  value,
  onChange,
  disabled = false,
  placeholder = 'Start writing...',
  height = 500
}) {
  const editorRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Load TinyMCE configuration based on current locale
    const locale = pathname?.includes('/ru') || pathname?.includes('/ru/') ? 'ru' : 'en';
    
    if (editorRef.current) {
      const editor = editorRef.current;
      // Set content when value changes
      if (editor.getContent() !== value) {
        editor.setContent(value || '');
      }
    }
  }, [value, pathname]);

  const handleEditorChange = (content) => {
    onChange(content);
  };

  // TinyMCE configuration
  const editorConfig = {
    height,
    readonly: disabled,
    disabled: disabled,
    menubar: disabled ? false : 'file edit view insert format tools table help',
    plugins: disabled ? [] : [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
    ],
    toolbar: disabled ? false : 'undo redo | blocks | ' +
             'bold italic forecolor | alignleft aligncenter ' +
             'alignright alignjustify | bullist numlist outdent indent | ' +
             'image link media | removeformat | help',
    content_style: `
      body {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        font-size: 14px;
        color: ${disabled ? '#9CA3AF' : '#ffffff'};
        background-color: ${disabled ? '#1F1F1F' : '#171717'};
      }
      .tox-tinymce {
        border: 1px solid #2E2F2F !important;
        border-radius: 8px !important;
      }
      .tox .tox-toolbar__primary {
        background-color: #262626 !important;
        border-bottom: 1px solid #2E2F2F !important;
      }
      .tox .tox-edit-area__iframe {
        background-color: ${disabled ? '#1F1F1F' : '#171717'} !important;
        color: ${disabled ? '#9CA3AF' : '#ffffff'} !important;
      }
      .tox-tinymce-inline {
        border: 1px solid #2E2F2F !important;
      }
    `,
    skin: 'oxide-dark',
    content_css: 'dark',
    placeholder: disabled ? 'This article is read-only' : placeholder,
    branding: false,
    promotion: false,
    convert_urls: false,
    apiKey: 'm2clehdewwagnw7ll63ephiedwqzmbtdsbfg0z90l7duo4on',
    images_upload_url: '/api/upload',
    images_upload_handler: (blobInfo, success, failure) => {
      if (disabled) {
        failure('Editor is in read-only mode');
        return;
      }
      
      const formData = new FormData();
      formData.append('file', blobInfo.blob(), blobInfo.filename());
      
      fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          success(result.url);
        } else {
          failure(result.error);
        }
      })
      .catch(error => {
        failure('Upload failed: ' + error.message);
      });
    },
    init_instance_callback: (editor) => {
      // Ensure the editor is editable (if not disabled)
      if (!disabled) {
        editor.mode.set('design');
        editor.focus();
      }
      
      // Set initial content
      if (value) {
        editor.setContent(value);
      }
    },
    setup: (editor) => {
      editor.on('init', () => {
        // Ensure editor is in design mode (if not disabled)
        if (!disabled) {
          editor.mode.set('design');
        }
      });
    },
    language: pathname?.includes('/ru') ? 'ru' : 'en',
    statusbar: !disabled,
    resize: !disabled,
    contextmenu: disabled ? false : 'link image table'
  };

  return (
    <div className="border border-[#2E2F2F] rounded-xl overflow-hidden">
      <Editor
        onEditorChange={handleEditorChange}
        init={editorConfig}
        onInit={(evt, editor) => editorRef.current = editor}
        value={value}
      />
    </div>
  );
}