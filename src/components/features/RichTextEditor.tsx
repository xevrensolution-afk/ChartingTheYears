'use client';

import React, { useRef, useEffect, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Avoid Next.js SSR hydration warnings for contentEditable
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && editorRef.current) {
      // Only update innerHTML if it's different from the value passed (prevents cursor reset)
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, mounted]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, arg = '') => {
    document.execCommand(command, false, arg);
    handleInput();
  };

  if (!mounted) {
    return (
      <div className="w-full min-h-[250px] border border-line rounded-lg bg-surface animate-pulse" />
    );
  }

  return (
    <div className="border border-line rounded-lg overflow-hidden bg-canvas focus-within:ring-2 focus-within:ring-accent/50 focus-within:border-accent transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-surface border-b border-line/60">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="h-8 w-8 inline-flex items-center justify-center hover:bg-surface-3 hover:text-ink transition-colors rounded font-extrabold text-sm text-ink-soft"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="h-8 w-8 inline-flex items-center justify-center hover:bg-surface-3 hover:text-ink transition-colors rounded italic text-sm text-ink-soft"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="h-8 w-8 inline-flex items-center justify-center hover:bg-surface-3 hover:text-ink transition-colors rounded underline text-sm text-ink-soft"
          title="Underline"
        >
          U
        </button>
        
        <div className="h-4 w-[1px] bg-line/60 mx-1" />

        <button
          type="button"
          onClick={() => execCommand('formatBlock', 'h3')}
          className="h-8 px-2 inline-flex items-center justify-center hover:bg-surface-3 hover:text-ink transition-colors rounded font-black text-[11px] text-ink-soft"
          title="Heading"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', 'p')}
          className="h-8 px-2 inline-flex items-center justify-center hover:bg-surface-3 hover:text-ink transition-colors rounded font-medium text-[11px] text-ink-soft"
          title="Paragraph"
        >
          P
        </button>

        <div className="h-4 w-[1px] bg-line/60 mx-1" />

        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="h-8 px-2.5 inline-flex items-center justify-center hover:bg-surface-3 hover:text-ink transition-colors rounded text-xs text-ink-soft font-semibold"
          title="Bullet List"
        >
          • Bullet List
        </button>

        <div className="h-4 w-[1px] bg-line/60 mx-1 ml-auto" />

        <button
          type="button"
          onClick={() => execCommand('removeFormat')}
          className="h-8 px-2 inline-flex items-center justify-center hover:bg-danger/10 hover:text-danger transition-colors rounded text-[11px] font-bold text-ink-mute"
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>
      
      {/* Editor Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 min-h-[250px] max-h-[500px] overflow-y-auto outline-none text-ink text-sm bg-canvas leading-relaxed prose prose-sm max-w-none prose-headings:text-ink prose-p:my-2 prose-ul:list-disc prose-ul:pl-5"
        placeholder={placeholder}
        style={{ boxSizing: 'border-box' }}
      />
    </div>
  );
}
