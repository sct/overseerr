import type { SettingsContextProps } from '@/context/SettingsContext';
import { SettingsContext } from '@/context/SettingsContext';
import { useContext } from 'react';

const useSettings = (): SettingsContextProps => {
  const settings = useContext(SettingsContext);

  return settings;
};

export default useSettings;
