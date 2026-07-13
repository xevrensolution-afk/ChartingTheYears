'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/ui/kit/Icon';
import { useAppSelector } from '@/store/hooks';
import { selectDefaultLanguage } from '@/features/settings/selectors';
import './LanguageSwitcher.css';

const LANGUAGES = [
  { code: 'EN', label: 'English', flag: '🇬🇧' },
  { code: 'FR', label: 'Français', flag: '🇫🇷' },
];

export function LanguageSwitcher() {
  const defaultLanguage = useAppSelector(selectDefaultLanguage);
  const [active, setActive] = useState(LANGUAGES[0]);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sync with defaultLanguage from admin settings
  useEffect(() => {
    const matched = LANGUAGES.find(
      (l) => l.label.toLowerCase() === defaultLanguage?.toLowerCase()
    );
    if (matched) setActive(matched);
  }, [defaultLanguage]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const handleSelect = (lang: typeof LANGUAGES[0]) => {
    setActive(lang);
    setIsOpen(false);
  };

  return (
    <div className="lang-wrap" ref={ref}>
      <button
        className="lang-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Switch language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="lang-flag">{active.flag}</span>
        <span className="lang-code">{active.code}</span>
        <Icon name="chevron-down" size={12} className={`lang-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="lang-menu" role="listbox" aria-label="Language options">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={`lang-option ${active.code === lang.code ? 'active' : ''}`}
              onClick={() => handleSelect(lang)}
              role="option"
              aria-selected={active.code === lang.code}
            >
              <span className="lang-flag">{lang.flag}</span>
              <span className="lang-option-label">{lang.label}</span>
              {active.code === lang.code && (
                <svg className="lang-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
