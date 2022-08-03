import { useContext } from 'react';
import type { LanguageContextProps } from '../context/LanguageContext';
import { LanguageContext } from '../context/LanguageContext';

const useLocale = (): Omit<LanguageContextProps, 'children'> => {
  const languageContext = useContext(LanguageContext);

  return languageContext;
};

export default useLocale;
