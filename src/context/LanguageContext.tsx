import React, { ReactNode } from 'react';

export type AvailableLocales = 'en' | 'ja' | 'fr' | 'nb-NO' | 'de' | 'ru';

interface LanguageContextProps {
  locale: AvailableLocales;
  children: (locale: string) => ReactNode;
  setLocale?: React.Dispatch<React.SetStateAction<AvailableLocales>>;
}

export const LanguageContext = React.createContext<
  Omit<LanguageContextProps, 'children'>
>({
  locale: 'en',
});
