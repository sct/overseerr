import { useContext } from 'react';
import { SettingsContext } from '../context/SettingsContext';

const useSettings = () => {
  const settings = useContext(SettingsContext);

  return settings;
};

export default useSettings;
