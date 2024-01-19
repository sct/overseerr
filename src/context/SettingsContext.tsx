import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import React from 'react';

export interface SettingsContextProps {
  currentSettings: PublicSettingsResponse;
  children?: React.ReactNode;
}

const defaultSettings = {
  initialized: false,
  applicationTitle: 'Overseerr',
  applicationUrl: '',
  hideAvailable: false,
  localLogin: true,
  movie4kEnabled: false,
  series4kEnabled: false,
  region: '',
  originalLanguage: '',
  partialRequestsEnabled: true,
  cacheImages: false,
  vapidPublic: '',
  enablePushRegistration: false,
  locale: 'en',
  emailEnabled: false,
  newPlexLogin: true,
};

export const SettingsContext = React.createContext<SettingsContextProps>({
  currentSettings: defaultSettings,
});

export const SettingsProvider = ({
  children,
  currentSettings,
}: SettingsContextProps) => {
  return (
    <SettingsContext.Provider value={{ currentSettings: {} }}>
      {children}
    </SettingsContext.Provider>
  );
};
