import React from 'react';
import useSWR from 'swr';
import { PublicSettingsResponse } from '../../server/interfaces/api/settingsInterfaces';

export interface SettingsContextProps {
  currentSettings: PublicSettingsResponse;
}

const defaultSettings = {
  initialized: false,
  applicationTitle: 'Overseerr',
  hideAvailable: false,
  localLogin: true,
  movie4kEnabled: false,
  series4kEnabled: false,
  region: '',
  originalLanguage: '',
  partialRequestsEnabled: true,
  cacheImages: false,
  notificationsEnabled: false,
  emailEnabled: false,
  discordEnabled: false,
  telegramEnabled: false,
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
