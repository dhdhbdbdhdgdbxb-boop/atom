'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Upload, Image as ImageIcon } from 'lucide-react';

export default function FreeTextEditor({ 
  value, 
  onChange,
  disabled = false,
  placeholder = 'Start writing...',
  height = 400
}) {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  // Drag and drop handlers
  const handleDragOver = (e) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        await uploadImage(file);
      }
    }
  };

  // File input handler
  const handleFileInput = async (e) => {
    if (disabled) return;
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await uploadImage(file);
    }
  };

  // Upload image to server
  const uploadImage = async (file) => {
    try {
      setUploadProgress('Uploading...');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        if (editorRef.current) {
          const range = editorRef.current.getSelection();
          const index = range ? range.index : editorRef.current.getLength();
          editorRef.current.insertEmbed(index, 'image', result.url, 'user');
          editorRef.current.insertText(index + 1, '\n\n');
        }
        setUploadProgress('Success!');
        setTimeout(() => setUploadProgress(null), 2000);
      } else {
        setUploadProgress('Upload failed');
        setTimeout(() => setUploadProgress(null), 3000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress('Upload failed');
      setTimeout(() => setUploadProgress(null), 3000);
    }
  };

  // Initialize Quill
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('quill').then((Quill) => {
        if (!containerRef.current || editorRef.current) return;

        const quill = new Quill.default(containerRef.current, {
          theme: 'snow',
          placeholder: disabled ? 'This article is read-only' : placeholder,
          modules: {
            toolbar: disabled ? false : [
              [{ 'header': [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'color': [] }, { 'background': [] }],
              [{ 'align': [] }],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              ['blockquote', 'code-block'],
              ['link', 'image'],
              ['clean']
            ],
            keyboard: { bindings: { tab: false } }
          }
        });

        editorRef.current = quill;

        // Set initial content
        if (value) quill.root.innerHTML = value;

        // Listen for changes
        if (!disabled) {
          quill.on('text-change', () => {
            const html = quill.root.innerHTML;
            onChange(html);
          });
        }

        // Apply disabled state
        if (disabled) quill.enable(false);
      });
    }

    return () => { editorRef.current = null; };
  }, [disabled, onChange, placeholder, value]);

  // Sync value prop with editor
  useEffect(() => {
    if (editorRef.current && editorRef.current.root.innerHTML !== value) {
      editorRef.current.root.innerHTML = value || '';
    }
  }, [value]);

  // Sync disabled state
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.enable(!disabled);
    }
  }, [disabled]);

  return (
    <div className="relative">
      <div
        className={`border border-[#2E2F2F] rounded-xl overflow-hidden ${
          isDragOver ? 'ring-2 ring-blue-500 bg-blue-500/5' : ''
        } ${disabled ? 'opacity-60' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div ref={containerRef} style={{ height: `${height}px` }} className="min-h-[${height}px]" />

        {uploadProgress && (
          <div className="absolute top-2 right-2 bg-green-500/90 text-white px-3 py-1 rounded-lg text-sm font-medium z-10">
            {uploadProgress}
          </div>
        )}
      </div>

      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-xl flex items-center justify-center z-20">
          <div className="text-center">
            <Upload className="h-12 w-12 text-blue-500 mx-auto mb-2" />
            <p className="text-blue-500 font-medium">Drop image here</p>
            <p className="text-gray-400 text-sm">PNG, JPG, GIF up to 5MB</p>
          </div>
        </div>
      )}

      {!disabled && (
        <div className="mt-2 flex items-center space-x-2">
          <label className="flex items-center space-x-2 px-3 py-2 bg-[#262626] hover:bg-[#2E2F2F] border border-[#2E2F2F] rounded-lg cursor-pointer transition-colors">
            <ImageIcon className="h-4 w-4 text-white" />
            <span className="text-sm text-white">Add Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
          <span className="text-xs text-gray-400">or drag & drop</span>
        </div>
      )}

      <style jsx global>{`
        .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid #2E2F2F !important;
          background-color: #262626 !important;
        }
        .ql-container.ql-snow {
          border: none !important;
          background-color: ${disabled ? '#1F1F1F' : '#171717'} !important;
          color: ${disabled ? '#9CA3AF' : '#ffffff'} !important;
          font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
          font-size: 14px !important;
        }
        .ql-editor {
          color: ${disabled ? '#9CA3AF' : '#ffffff'} !important;
          min-height: ${height - 42}px !important;
        }
        .ql-editor.ql-blank::before {
          color: ${disabled ? '#9CA3AF' : '#6B7280'} !important;
          font-style: normal !important;
        }
        .ql-snow .ql-stroke {
          stroke: ${disabled ? '#6B7280' : '#ffffff'} !important;
        }
        .ql-snow .ql-fill {
          fill: ${disabled ? '#6B7280' : '#ffffff'} !important;
        }
        .ql-snow .ql-picker {
          color: ${disabled ? '#6B7280' : '#ffffff'} !important;
        }
        .ql-snow .ql-picker-options {
          background-color: #262626 !important;
          border: 1px solid #2E2F2F !important;
        }
        .ql-snow .ql-picker-item {
          color: #ffffff !important;
        }
        .ql-snow .ql-picker-item:hover {
          background-color: #374151 !important;
        }
        .ql-snow .ql-tooltip {
          background-color: #262626 !important;
          border: 1px solid #2E2F2F !important;
          color: #ffffff !important;
        }
        .ql-snow .ql-tooltip input {
          background-color: #171717 !important;
          border: 1px solid #2E2F2F !important;
          color: #ffffff !important;
        }
        .ql-snow .ql-tooltip .ql-tooltip-arrow {
          border-color: #262626 transparent transparent !important;
        }
        .ql-editor img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 8px !important;
          margin: 8px 0 !important;
        }
      `}</style>
    </div>
  );
}
