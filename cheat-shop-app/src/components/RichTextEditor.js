'use client';

import { useEffect, useRef } from 'react';

// Simple rich text editor component using contenteditable
export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Enter content...',
  className = ''
}) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      execCommand('insertText', '    '); // Insert 4 spaces
    }
  };

  const toolbar = (
    <div className="flex items-center space-x-2 p-2 bg-[#262626] border-b border-[#2E2F2F] rounded-t-xl">
      <button
        type="button"
        onClick={() => execCommand('bold')}
        className="px-3 py-1 text-white hover:bg-[#2E2F2F] rounded text-sm font-bold"
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={() => execCommand('italic')}
        className="px-3 py-1 text-white hover:bg-[#2E2F2F] rounded text-sm italic"
        title="Italic"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={() => execCommand('underline')}
        className="px-3 py-1 text-white hover:bg-[#2E2F2F] rounded text-sm underline"
        title="Underline"
      >
        <u>U</u>
      </button>
      <div className="w-px h-6 bg-[#2E2F2F]"></div>
      <button
        type="button"
        onClick={() => execCommand('formatBlock', 'h1')}
        className="px-3 py-1 text-white hover:bg-[#2E2F2F] rounded text-sm"
        title="Heading 1"
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => execCommand('formatBlock', 'h2')}
        className="px-3 py-1 text-white hover:bg-[#2E2F2F] rounded text-sm"
        title="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => execCommand('formatBlock', 'h3')}
        className="px-3 py-1 text-white hover:bg-[#2E2F2F] rounded text-sm"
        title="Heading 3"
      >
        H3
      </button>
      <div className="w-px h-6 bg-[#2E2F2F]"></div>
      <button
        type="button"
        onClick={() => execCommand('insertUnorderedList')}
        className="px-3 py-1 text-white hover:bg-[#2E2F2F] rounded text-sm"
        title="Bullet List"
      >
        • List
      </button>
      <button
        type="button"
        onClick={() => execCommand('insertOrderedList')}
        className="px-3 py-1 text-white hover:bg-[#2E2F2F] rounded text-sm"
        title="Numbered List"
      >
        1. List
      </button>
      <div className="w-px h-6 bg-[#2E2F2F]"></div>
      <button
        type="button"
        onClick={() => execCommand('createLink', prompt('Enter URL:'))}
        className="px-3 py-1 text-white hover:bg-[#2E2F2F] rounded text-sm"
        title="Insert Link"
      >
        Link
      </button>
      <button
        type="button"
        onClick={() => execCommand('removeFormat')}
        className="px-3 py-1 text-white hover:bg-[#2E2F2F] rounded text-sm"
        title="Clear Formatting"
      >
        Clear
      </button>
    </div>
  );

  return (
    <div className={`border border-[#2E2F2F] rounded-xl overflow-hidden ${className}`}>
      {toolbar}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="min-h-[200px] p-4 bg-[#171717] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-20"
        style={{
          wordBreak: 'break-word',
        }}
        suppressContentEditableWarning={true}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
}