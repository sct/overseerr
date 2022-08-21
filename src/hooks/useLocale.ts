import type { LanguageContextProps } from '@/context/LanguageContext';
import { LanguageContext } from '@/context/LanguageContext';
import { useContext } from 'react';

const useLocale = (): Omit<LanguageContextProps, 'children'> => {
  const languageContext = useContext(LanguageContext);

  return languageContext;
};

export default useLocale;
