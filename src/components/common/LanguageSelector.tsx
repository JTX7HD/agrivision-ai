import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, Search, X } from 'lucide-react';
import { useTranslation } from '../../i18n/i18nContext';
import type { LanguageMeta, Locale } from '../../i18n/types';

interface LanguageSelectorProps {
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
  const { locale, setLocale, currentLanguage, supportedLanguages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus search input
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const filteredLanguages = supportedLanguages.filter((lang) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      lang.name.toLowerCase().includes(query) ||
      lang.nativeName.toLowerCase().includes(query) ||
      lang.script.toLowerCase().includes(query) ||
      lang.code.toLowerCase().includes(query)
    );
  });

  const handleSelectLanguage = (code: Locale) => {
    setLocale(code);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id="agrivision-language-selector-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select interface language. Currently selected: ${currentLanguage.name}`}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-xs transition-all cursor-pointer hover:border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
        style={{
          borderColor: '#E4DABF',
          background: '#F0E9D8',
          color: '#28271F'
        }}
      >
        <Globe className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
        <span className="font-bold text-emerald-950 font-sans">
          {currentLanguage.nativeName}
        </span>
        <span className="text-[10px] opacity-75 font-mono">
          ({currentLanguage.name})
        </span>
      </button>

      {/* Language Selection Modal / Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Select Language"
          className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-80 sm:w-96 max-h-[480px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col text-slate-100 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header & Search */}
          <div className="p-3 bg-slate-950 border-b border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Select Language (22 Indian Languages + EN)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Close language selector"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by English name, script, or native text..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Languages List */}
          <div className="overflow-y-auto flex-1 p-2 space-y-1 divide-y divide-slate-800/50">
            {filteredLanguages.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No matching language found for "{searchQuery}".
              </div>
            ) : (
              filteredLanguages.map((lang: LanguageMeta) => {
                const isSelected = lang.code === locale;
                const isRtl = lang.dir === 'rtl';

                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/80 border border-emerald-500/50 text-white'
                        : 'hover:bg-slate-800/70 text-slate-200'
                    }`}
                  >
                    <div className="flex items-baseline gap-2.5">
                      <span
                        dir={isRtl ? 'rtl' : 'ltr'}
                        className="text-base font-bold font-sans tracking-tight text-white"
                      >
                        {lang.nativeName}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {lang.name}
                      </span>
                      {isRtl && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
                          RTL
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                        {lang.script}
                      </span>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer with Constitutional context */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Official 8th Schedule Indian Languages</span>
            <span className="font-mono text-emerald-400">22 + 1 (EN)</span>
          </div>
        </div>
      )}
    </div>
  );
};
