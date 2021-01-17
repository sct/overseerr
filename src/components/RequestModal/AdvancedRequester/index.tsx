/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { SmallLoadingSpinner } from '../../Common/LoadingSpinner';
import type {
  ServiceCommonServer,
  ServiceCommonServerWithDetails,
} from '../../../../server/interfaces/api/serviceInterfaces';
import { defineMessages, useIntl } from 'react-intl';

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const messages = defineMessages({
  advancedoptions: 'Advanced Options',
  destinationserver: 'Destination Server',
  qualityprofile: 'Quality Profile',
  rootfolder: 'Root Folder',
  animenote: '* This series is an anime.',
  default: '(Default)',
  loadingprofiles: 'Loading profiles…',
  loadingfolders: 'Loading folders…',
});

export type RequestOverrides = {
  server?: number;
  profile?: number;
  folder?: string;
};

interface AdvancedRequesterProps {
  type: 'movie' | 'tv';
  is4k: boolean;
  isAnime?: boolean;
  defaultOverrides?: RequestOverrides;
  onChange: (overrides: RequestOverrides) => void;
}

const AdvancedRequester: React.FC<AdvancedRequesterProps> = ({
  type,
  is4k = false,
  isAnime = false,
  defaultOverrides,
  onChange,
}) => {
  const intl = useIntl();
  const { data, error } = useSWR<ServiceCommonServer[]>(
    `/api/v1/service/${type === 'movie' ? 'radarr' : 'sonarr'}`,
    {
      refreshInterval: 0,
      refreshWhenHidden: false,
      revalidateOnFocus: false,
      revalidateOnMount: true,
    }
  );
  const [selectedServer, setSelectedServer] = useState<number | null>(
    defaultOverrides?.server !== undefined && defaultOverrides?.server >= 0
      ? defaultOverrides?.server
      : null
  );
  const [selectedProfile, setSelectedProfile] = useState<number>(
    defaultOverrides?.profile ?? -1
  );
  const [selectedFolder, setSelectedFolder] = useState<string>(
    defaultOverrides?.folder ?? ''
  );
  const {
    data: serverData,
    isValidating,
  } = useSWR<ServiceCommonServerWithDetails>(
    selectedServer !== null
      ? `/api/v1/service/${
          type === 'movie' ? 'radarr' : 'sonarr'
        }/${selectedServer}`
      : null,
    {
      refreshInterval: 0,
      refreshWhenHidden: false,
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    let defaultServer = data?.find(
      (server) => server.isDefault && is4k === server.is4k
    );

    if (!defaultServer && (data ?? []).length > 0) {
      defaultServer = data?.[0];
    }

    if (
      defaultServer &&
      defaultServer.id !== selectedServer &&
      (!defaultOverrides || defaultOverrides.server === null)
    ) {
      setSelectedServer(defaultServer.id);
    }
  }, [data]);

  useEffect(() => {
    if (serverData) {
      const defaultProfile = serverData.profiles.find(
        (profile) =>
          profile.id ===
          (isAnime
            ? serverData.server.activeAnimeProfileId
            : serverData.server.activeProfileId)
      );
      const defaultFolder = serverData.rootFolders.find(
        (folder) =>
          folder.path ===
          (isAnime
            ? serverData.server.activeAnimeDirectory
            : serverData.server.activeDirectory)
      );

      if (
        defaultProfile &&
        defaultProfile.id !== selectedProfile &&
        (!defaultOverrides || defaultOverrides.profile === null)
      ) {
        setSelectedProfile(defaultProfile.id);
      }

      if (
        defaultFolder &&
        defaultFolder.path !== selectedFolder &&
        (!defaultOverrides || defaultOverrides.folder === null)
      ) {
        setSelectedFolder(defaultFolder?.path ?? '');
      }
    }
  }, [serverData]);

  useEffect(() => {
    if (
      defaultOverrides &&
      defaultOverrides.server !== null &&
      defaultOverrides.server !== undefined
    ) {
      setSelectedServer(defaultOverrides.server);
    }

    if (
      defaultOverrides &&
      defaultOverrides.profile !== null &&
      defaultOverrides.profile !== undefined
    ) {
      setSelectedProfile(defaultOverrides.profile);
    }

    if (
      defaultOverrides &&
      defaultOverrides.folder !== null &&
      defaultOverrides.folder !== undefined
    ) {
      setSelectedFolder(defaultOverrides.folder);
    }
  }, [
    defaultOverrides?.server,
    defaultOverrides?.folder,
    defaultOverrides?.profile,
  ]);

  useEffect(() => {
    if (selectedServer !== null) {
      onChange({
        folder: selectedFolder !== '' ? selectedFolder : undefined,
        profile: selectedProfile !== -1 ? selectedProfile : undefined,
        server: selectedServer ?? undefined,
      });
    }
  }, [selectedFolder, selectedServer, selectedProfile]);

  if (!data && !error) {
    return (
      <div className="w-full mb-2">
        <SmallLoadingSpinner />
      </div>
    );
  }

  if (!data || selectedServer === null) {
    return null;
  }

  return (
    <>
      <div className="flex items-center mb-2 font-bold tracking-wider">
        <svg
          className="w-4 h-4 mr-1"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9.707 7.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L13 8.586V5h3a2 2 0 012 2v5a2 2 0 01-2 2H8a2 2 0 01-2-2V7a2 2 0 012-2h3v3.586L9.707 7.293zM11 3a1 1 0 112 0v2h-2V3z" />
          <path d="M4 9a2 2 0 00-2 2v5a2 2 0 002 2h8a2 2 0 002-2H4V9z" />
        </svg>
        {intl.formatMessage(messages.advancedoptions)}
      </div>
      <div className="p-4 bg-gray-600 rounded-md shadow">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <div className="flex-grow flex-shrink-0 w-full mb-2 md:w-1/3 md:pr-4 md:mb-0">
            <label htmlFor="server" className="block text-sm font-medium">
              {intl.formatMessage(messages.destinationserver)}
            </label>
            <select
              id="server"
              name="server"
              onChange={(e) => setSelectedServer(Number(e.target.value))}
              onBlur={(e) => setSelectedServer(Number(e.target.value))}
              value={selectedServer}
              className="block w-full py-2 pl-3 pr-10 mt-1 text-base leading-6 text-white transition duration-150 ease-in-out bg-gray-800 border-gray-700 rounded-md form-select focus:outline-none focus:ring-blue focus:border-blue-300 sm:text-sm sm:leading-5"
            >
              {data.map((server) => (
                <option key={`server-list-${server.id}`} value={server.id}>
                  {server.name}
                  {server.isDefault && server.is4k === is4k
                    ? ` ${intl.formatMessage(messages.default)}`
                    : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-grow flex-shrink-0 w-full mb-2 md:w-1/3 md:pr-4 md:mb-0">
            <label htmlFor="server" className="block text-sm font-medium">
              {intl.formatMessage(messages.qualityprofile)}
            </label>
            <select
              id="profile"
              name="profile"
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(Number(e.target.value))}
              onBlur={(e) => setSelectedProfile(Number(e.target.value))}
              className="block w-full py-2 pl-3 pr-10 mt-1 text-base leading-6 text-white transition duration-150 ease-in-out bg-gray-800 border-gray-700 rounded-md form-select focus:outline-none focus:ring-blue focus:border-blue-300 sm:text-sm sm:leading-5"
            >
              {isValidating && (
                <option value="">
                  {intl.formatMessage(messages.loadingprofiles)}
                </option>
              )}
              {!isValidating &&
                serverData &&
                serverData.profiles.map((profile) => (
                  <option key={`profile-list${profile.id}`} value={profile.id}>
                    {profile.name}
                    {isAnime &&
                    serverData.server.activeAnimeProfileId === profile.id
                      ? ` ${intl.formatMessage(messages.default)}`
                      : !isAnime &&
                        serverData.server.activeProfileId === profile.id
                      ? ` ${intl.formatMessage(messages.default)}`
                      : ''}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex-grow flex-shrink-0 w-full mb-2 md:w-1/3 md:mb-0">
            <label htmlFor="server" className="block text-sm font-medium">
              {intl.formatMessage(messages.rootfolder)}
            </label>
            <select
              id="folder"
              name="folder"
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              onBlur={(e) => setSelectedFolder(e.target.value)}
              className="block w-full py-2 pl-3 pr-10 mt-1 text-base leading-6 text-white transition duration-150 ease-in-out bg-gray-800 border-gray-700 rounded-md form-select focus:outline-none focus:ring-blue focus:border-blue-300 sm:text-sm sm:leading-5"
            >
              {isValidating && (
                <option value="">
                  {intl.formatMessage(messages.loadingfolders)}
                </option>
              )}
              {!isValidating &&
                serverData &&
                serverData.rootFolders.map((folder) => (
                  <option key={`folder-list${folder.id}`} value={folder.path}>
                    {folder.path} ({formatBytes(folder.freeSpace ?? 0)})
                    {isAnime &&
                    serverData.server.activeAnimeDirectory === folder.path
                      ? ` ${intl.formatMessage(messages.default)}`
                      : !isAnime &&
                        serverData.server.activeDirectory === folder.path
                      ? ` ${intl.formatMessage(messages.default)}`
                      : ''}
                  </option>
                ))}
            </select>
          </div>
        </div>
        {isAnime && (
          <div className="mt-4 italic">
            {intl.formatMessage(messages.animenote)}
          </div>
        )}
      </div>
    </>
  );
};

export default AdvancedRequester;
