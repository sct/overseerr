import React from 'react';
import { PublicSettingsResponse } from '../../server/interfaces/api/settingsInterfaces';
import useSWR from 'swr';

export interface SettingsContextProps {
  currentSettings: PublicSettingsResponse;
}

const defaultSettings = {
  initialized: false,
  applicationTitle: 'Overseerr',
  hideAvailable: false,
  localLogin: false,
  movie4kEnabled: false,
  series4kEnabled: false,
  region: '',
};

export const SettingsContext = React.createContext<SettingsContextProps>({
  currentSettings: defaultSettings,
});

export const SettingsProvider: React.FC<SettingsContextProps> = ({
  children,
  currentSettings,
}) => {
  const { data, error } = useSWR<PublicSettingsResponse>(
    '/api/v1/settings/public',
    { initialData: currentSettings }
  );

  let newSettings = defaultSettings;

  if (data && !error) {
    newSettings = data;
  }

  return (
    <SettingsContext.Provider value={{ currentSettings: newSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
