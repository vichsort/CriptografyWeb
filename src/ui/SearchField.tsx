'use client';

import { useEffect, useRef } from 'react';
import { cn } from './cn';
import { plainTextEntry } from './field';
import { SearchIcon } from './icons';

interface SearchFieldProps {
  value: string;
  onChange(value: string): void;
  placeholder: string;
  /** "/" focuses this field from anywhere outside another text entry. */
  shortcut?: '/';
  size?: 'sm' | 'md';
}

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return (
    target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]') !==
    null
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
  shortcut,
  size = 'md',
}: SearchFieldProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shortcut !== '/') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.defaultPrevented || isTextEntry(event.target)) return;
      event.preventDefault();
      ref.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [shortcut]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 bg-fill text-label-tertiary transition-shadow duration-fast focus-within:ring-[3px] focus-within:ring-tint-weak',
        size === 'md' ? 'rounded-md px-[14px] py-[10px]' : 'rounded-[10px] px-3 py-2',
      )}
    >
      <SearchIcon className="shrink-0 text-callout" />
      <input
        {...plainTextEntry}
        ref={ref}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-input text-label outline-none focus-visible:outline-none"
      />
      {shortcut && (
        <kbd
          aria-hidden="true"
          className="hidden rounded-[5px] border border-separator px-[6px] font-sans text-caption text-label-tertiary pointer-fine:inline"
        >
          {shortcut}
        </kbd>
      )}
    </div>
  );
}
