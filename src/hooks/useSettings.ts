import { useContext } from 'react';
import type { SettingsContextProps } from '../context/SettingsContext';
import { SettingsContext } from '../context/SettingsContext';

const useSettings = (): SettingsContextProps => {
  const settings = useContext(SettingsContext);

  return settings;
};

export default useSettings;
