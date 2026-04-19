'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Highlighter,
  X,
  Save,
  Loader
} from 'lucide-react';

export default function TipTapEditor({ 
  value = '', 
  onChange, 
  onSave,
  onAutoSave,
  disabled = false, 
  placeholder = 'Начните писать...',
  height = 400,
  autoSaveInterval = 30000, // 30 секунд
  languages = ['ru', 'en'],
  currentLanguage = 'ru',
  onLanguageChange,
  title = '',
  titleSetter
}) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const autoSaveRef = useRef();
  const editorRef = useRef();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:text-blue-700 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      onChange?.(content);
      setIsDirty(true);
      
      // Запускаем автосохранение
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
      autoSaveRef.current = setTimeout(() => {
        handleAutoSave(content);
      }, autoSaveInterval);
    },
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none p-4 min-h-[400px]',
      },
    },
  });

  // Автосохранение
  const handleAutoSave = useCallback(async (content) => {
    if (!onAutoSave || isSaving) return;
    
    setIsSaving(true);
    try {
      await onAutoSave(content);
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onAutoSave, isSaving]);

  // Ручное сохранение
  const handleManualSave = async () => {
    if (!onSave || isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave(editor?.getHTML());
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Сохранение при выходе из страницы
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty && editor?.getHTML()) {
        e.preventDefault();
        e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите выйти?';
        
        // Пытаемся сохранить перед выходом
        if (onAutoSave) {
          onAutoSave(editor.getHTML());
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isDirty && editor?.getHTML()) {
        if (onAutoSave) {
          onAutoSave(editor.getHTML());
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [isDirty, editor, onAutoSave]);

  // Добавление ссылки
  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setShowLinkDialog(false);
      setLinkUrl('');
      setLinkText('');
    }
  };

  // Добавление изображения
  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt }).run();
      setShowImageDialog(false);
      setImageUrl('');
      setImageAlt('');
    }
  };

  // Добавление таблицы
  const addTable = () => {
    editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
    setShowTableDialog(false);
    setTableRows(3);
    setTableCols(3);
  };

  if (!editor) {
    return <div className="flex items-center justify-center h-64">Загрузка редактора...</div>;
  }

  return (
    <div className="border border-[#2E2F2F] rounded-xl bg-[#171717] overflow-hidden">
      {/* Панель инструментов */}
      <div className="border-b border-[#2E2F2F] p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Форматирование текста */}
          <div className="flex items-center gap-1 border-r border-[#2E2F2F] pr-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded-lg transition-colors ${
                editor.isActive('bold') ? 'bg-white text-black' : 'hover:bg-[#262626] text-white'
              }`}
              title="Жирный"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded-lg transition-colors ${
                editor.isActive('italic') ? 'bg-white text-black' : 'hover:bg-[#262626] text-white'
              }`}
              title="Курсив"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-2 rounded-lg transition-colors ${
                editor.isActive('underline') ? 'bg-white text-black' : 'hover:bg-[#262626] text-white'
              }`}
              title="Подчеркивание"
            >
              <UnderlineIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-2 rounded-lg transition-colors ${
                editor.isActive('strike') ? 'bg-white text-black' : 'hover:bg-[#262626] text-white'
              }`}
              title="Зачеркивание"
            >
              <Strikethrough className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-2 rounded-lg transition-colors ${
                editor.isActive('code') ? 'bg-white text-black' : 'hover:bg-[#262626] text-white'
              }`}
              title="Код"
            >
              <Code className="h-4 w-4" />
            </button>
          </div>

          {/* Заголовки */}
          <div className="flex items-center gap-1 border-r border-[#2E2F2F] pr-2">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 rounded-lg transition-colors ${
                editor.isActive('heading', { level: 1 }) ? 'bg-white text-black' : 'hover:bg-[#262626] text-white'
              }`}
              title="Заголовок 1"
            >
              <Heading1 className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded-lg transition-colors ${
                editor.isActive('heading', { level: 2 }) ? 'bg-white text-black' : 'hover:bg-[#262626] text-white'
              }`}
              title="Заголовок 2"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-2 rounded-lg transition-colors ${
                editor.isActive('heading', { level: 3 }) ? 'bg-white text-black' : 'hover:bg-[#262626] text-white'
              }`}
              title="Заголовок 3"
            >
              <Heading3 className="h-4 w-4" />
            </button>
          </div>

          {/* Списки и цитаты */}
          <div className="flex items-center gap-1 border-r border-[#2E2F2F] pr-2">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded-lg transition-colors ${
                editor.isActive('bulletList') ? 'bg-white text-black' : 'hover:bg-[#262626] text-white'
              }`}
              title="Маркированный список"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded-lg transition-colors ${
                editor.isActive('orderedList') ? 'bg-white text-black' : 'hover:bg-[#262626] text-white'
              }`}
              title="Нумерованный список"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded-lg transition-colors ${
                editor.isActive('blockquote') ? 'bg-white text-black' : 'hover:bg-[#262626] text-white'
              }`}
              title="Цитата"
            >
              <Quote className="h-4 w-4" />
            </button>
          </div>

          {/* Выравнивание */}
          <div className="flex items-center gap-1 border-r border-[#2E2F2F] pr-2">
            <button
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={`p-2 rounded-lg transition-colors ${
                editor.isActive({ textAlign: 'left' }) ? 'bg-white text-black' : 'hover:bg-[#262626] text-white'
              }`}
              title="Выровнять по левому краю"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={`p-2 rounded-lg transition-colors ${
                editor.isActive({ textAlign: 'center' }) ? 'bg-white text-black' : 'hover:bg-[#262626] text-white'
              }`}
              title="Выровнять по центру"
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={`p-2 rounded-lg transition-colors ${
                editor.isActive({ textAlign: 'right' }) ? 'bg-white text-black' : 'hover:bg-[#262626] text-white'
              }`}
              title="Выровнять по правому краю"
            >
              <AlignRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              className={`p-2 rounded-lg transition-colors ${
                editor.isActive({ textAlign: 'justify' }) ? 'bg-white text-black' : 'hover:bg-[#262626] text-white'
              }`}
              title="Выровнять по ширине"
            >
              <AlignJustify className="h-4 w-4" />
            </button>
          </div>

          {/* Цвет и выделение */}
          <div className="flex items-center gap-1 border-r border-[#2E2F2F] pr-2">
            <button
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={`p-2 rounded-lg transition-colors ${
                editor.isActive('highlight') ? 'bg-white text-black' : 'hover:bg-[#262626] text-white'
              }`}
              title="Выделение"
            >
              <Highlighter className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowLinkDialog(true)}
              className="p-2 rounded-lg hover:bg-[#262626] text-white transition-colors"
              title="Добавить ссылку"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowImageDialog(true)}
              className="p-2 rounded-lg hover:bg-[#262626] text-white transition-colors"
              title="Добавить изображение"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowTableDialog(true)}
              className="p-2 rounded-lg hover:bg-[#262626] text-white transition-colors"
              title="Добавить таблицу"
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Отмена и возврат */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-2 rounded-lg hover:bg-[#262626] text-white transition-colors disabled:opacity-50"
              title="Отменить"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-2 rounded-lg hover:bg-[#262626] text-white transition-colors disabled:opacity-50"
              title="Вернуть"
            >
              <Redo className="h-4 w-4" />
            </button>
          </div>

          {/* Кнопка сохранения */}
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleManualSave}
              disabled={!isDirty || isSaving}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isDirty && !isSaving
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
              title="Сохранить"
            >
              {isSaving ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="text-sm">
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </span>
            </button>
          </div>
        </div>

        {/* Информация о сохранении */}
        {lastSaved && (
          <div className="mt-2 text-xs text-gray-400">
            Последнее сохранение: {lastSaved.toLocaleTimeString()}
            {isDirty && <span className="text-yellow-400 ml-2">• Есть несохраненные изменения</span>}
          </div>
        )}
      </div>

      {/* Область редактора */}
      <div 
        className="min-h-[400px] bg-[#0A0A0A] text-white"
        style={{ height: `${height}px` }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Диалог добавления ссылки */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#171717] border border-[#2E2F2F] rounded-xl p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Добавить ссылку</h3>
              <button
                onClick={() => setShowLinkDialog(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Текст ссылки</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Отображаемый текст"
                  className="w-full px-3 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLinkDialog(false)}
                  className="flex-1 px-4 py-2 bg-[#262626] hover:bg-[#2E2F2F] text-white rounded-lg"
                >
                  Отмена
                </button>
                <button
                  onClick={addLink}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Диалог добавления изображения */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#171717] border border-[#2E2F2F] rounded-xl p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Добавить изображение</h3>
              <button
                onClick={() => setShowImageDialog(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">URL изображения</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Описание</label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Описание изображения"
                  className="w-full px-3 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowImageDialog(false)}
                  className="flex-1 px-4 py-2 bg-[#262626] hover:bg-[#2E2F2F] text-white rounded-lg"
                >
                  Отмена
                </button>
                <button
                  onClick={addImage}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Диалог добавления таблицы */}
      {showTableDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#171717] border border-[#2E2F2F] rounded-xl p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Добавить таблицу</h3>
              <button
                onClick={() => setShowTableDialog(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Строки</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tableRows}
                    onChange={(e) => setTableRows(parseInt(e.target.value) || 3)}
                    className="w-full px-3 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Столбцы</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tableCols}
                    onChange={(e) => setTableCols(parseInt(e.target.value) || 3)}
                    className="w-full px-3 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTableDialog(false)}
                  className="flex-1 px-4 py-2 bg-[#262626] hover:bg-[#2E2F2F] text-white rounded-lg"
                >
                  Отмена
                </button>
                <button
                  onClick={addTable}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}