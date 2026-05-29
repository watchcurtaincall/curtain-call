'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import { Bold, Italic, Heading1, Heading2, Quote, List, ListOrdered, Image as ImageIcon } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, className = '' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      ImageExtension,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: `prose prose-invert prose-sm sm:prose-base focus:outline-none max-w-none min-h-[150px] px-4 py-3 bg-zinc-900 border border-white/10 rounded-b-xl text-zinc-300 leading-relaxed ${className}`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex flex-col rounded-xl overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 bg-zinc-950 border border-white/10 border-b-0 p-2 rounded-t-xl">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive('bold') ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
          }`}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive('italic') ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
          }`}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>

        <div className="w-[1px] h-5 bg-white/10 mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive('heading', { level: 1 }) ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
          }`}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive('heading', { level: 2 }) ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
          }`}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>

        <div className="w-[1px] h-5 bg-white/10 mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive('blockquote') ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
          }`}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive('bulletList') ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
          }`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive('orderedList') ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <div className="w-[1px] h-5 bg-white/10 mx-1"></div>

        <button
          type="button"
          onClick={addImage}
          className="p-2 rounded-lg transition-colors flex items-center justify-center text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
          title="Add Image URL"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
