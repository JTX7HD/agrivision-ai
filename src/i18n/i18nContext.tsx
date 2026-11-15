import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { Locale, TranslationDictionary, LanguageMeta } from './types';
import { SUPPORTED_LANGUAGES } from './types';

// Import all 23 language dictionaries
import { en } from './locales/en';
import { hi } from './locales/hi';
import { bn } from './locales/bn';
import { te } from './locales/te';
import { ta } from './locales/ta';
import { mr } from './locales/mr';
import { ur } from './locales/ur';
import { gu } from './locales/gu';
import { kn } from './locales/kn';
import { ml } from './locales/ml';
import { or } from './locales/or';
import { pa } from './locales/pa';
import { as } from './locales/as';
import { mai } from './locales/mai';
import { ne } from './locales/ne';
import { sa } from './locales/sa';
import { kok } from './locales/kok';
import { ks } from './locales/ks';
import { sd } from './locales/sd';
import { doi } from './locales/doi';
import { mni } from './locales/mni';
import { brx } from './locales/brx';
import { sat } from './locales/sat';

export interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationDictionary;
  currentLanguage: LanguageMeta;
  supportedLanguages: LanguageMeta[];
}

const LOCAL_STORAGE_KEY = 'agrivision_user_locale';

export const DICTIONARIES: Record<Locale, TranslationDictionary> = {
  en,
  hi,
  bn,
  te,
  ta,
  mr,
  ur,
  gu,
  kn,
  ml,
  or,
  pa,
  as,
  mai,
  ne,
  sa,
  kok,
  ks,
  sd,
  doi,
  mni,
  brx,
  sat
};

const DEFAULT_META: LanguageMeta = SUPPORTED_LANGUAGES[0];

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: en,
  currentLanguage: DEFAULT_META,
  supportedLanguages: SUPPORTED_LANGUAGES
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY) as Locale | null;
      if (saved && saved in DICTIONARIES) {
        return saved;
      }
    } catch {
      // Ignore local storage error
    }
    return 'en';
  });

  const currentLanguage = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === locale) || DEFAULT_META;
  }, [locale]);

  // Update document attributes for direction (LTR vs RTL) and language code
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isRtl = currentLanguage.dir === 'rtl';
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      document.documentElement.lang = locale;

      // Add or remove RTL class on body for CSS styling hooks if needed
      if (isRtl) {
        document.body.classList.add('rtl-active');
      } else {
        document.body.classList.remove('rtl-active');
      }
    }
  }, [locale, currentLanguage]);

  const setLocale = (newLocale: Locale) => {
    if (newLocale in DICTIONARIES) {
      setLocaleState(newLocale);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, newLocale);
      } catch {
        // Ignore local storage error
      }
    }
  };

  const t = useMemo(() => {
    return DICTIONARIES[locale] || en;
  }, [locale]);

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        currentLanguage,
        supportedLanguages: SUPPORTED_LANGUAGES
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = (): I18nContextType => {
  return useContext(I18nContext);
};
