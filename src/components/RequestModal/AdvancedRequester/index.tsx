/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { SmallLoadingSpinner } from '../../Common/LoadingSpinner';
import type {
  ServiceCommonServer,
  ServiceCommonServerWithDetails,
} from '../../../../server/interfaces/api/serviceInterfaces';

interface AdvancedRequesterProps {
  type: 'movie' | 'tv';
  is4k: boolean;
}

const AdvancedRequester: React.FC<AdvancedRequesterProps> = ({
  type,
  is4k = false,
}) => {
  const { data, error } = useSWR<ServiceCommonServer[]>(
    `/api/v1/service/${type === 'movie' ? 'radarr' : 'sonarr'}`,
    {
      refreshInterval: 0,
      refreshWhenHidden: false,
      revalidateOnFocus: false,
    }
  );
  const [selectedServer, setSelectedServer] = useState<number | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<number>(0);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
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

    if (defaultServer && defaultServer.id !== selectedServer) {
      setSelectedServer(defaultServer.id);
    }
  }, [data]);

  useEffect(() => {
    if (serverData) {
      const defaultProfile = serverData.profiles.find(
        (profile) => profile.id === serverData.server.activeProfileId
      );
      const defaultFolder = serverData.rootFolders.find(
        (folder) => folder.path === serverData.server.activeDirectory
      );

      if (defaultProfile && defaultProfile.id !== selectedProfile) {
        setSelectedProfile(defaultProfile.id);
      }

      if (defaultFolder && defaultFolder.path !== selectedFolder) {
        setSelectedFolder(defaultFolder?.path ?? '');
      }
    }
  }, [serverData]);

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

  const isLoadingDetails = (!data && !error) || isValidating;

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
        Advanced Options
      </div>
      <div className="flex flex-col items-center justify-between p-4 bg-gray-600 rounded-md md:flex-row">
        <div className="flex-grow flex-shrink-0 w-full mb-2 md:w-auto md:mr-4 md:mb-0">
          <label htmlFor="server" className="block text-sm font-medium">
            Destination Server
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
                {server.isDefault ? ' (DEFAULT)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-grow flex-shrink-0 w-full mb-2 md:w-auto md:mr-4 md:mb-0">
          <label htmlFor="server" className="block text-sm font-medium">
            Quality Profile
          </label>
          <select
            id="profile"
            name="profile"
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(Number(e.target.value))}
            onBlur={(e) => setSelectedProfile(Number(e.target.value))}
            className="block w-full py-2 pl-3 pr-10 mt-1 text-base leading-6 text-white transition duration-150 ease-in-out bg-gray-800 border-gray-700 rounded-md form-select focus:outline-none focus:ring-blue focus:border-blue-300 sm:text-sm sm:leading-5"
          >
            {isLoadingDetails && <option value="">Loading Profiles...</option>}
            {!isLoadingDetails &&
              serverData &&
              serverData.profiles.map((profile) => (
                <option key={`profile-list${profile.id}`} value={profile.id}>
                  {profile.name}
                </option>
              ))}
          </select>
        </div>
        <div className="flex-grow flex-shrink-0 w-full mb-2 md:w-auto md:mb-0">
          <label htmlFor="server" className="block text-sm font-medium">
            Root Folder
          </label>
          <select
            id="folder"
            name="folder"
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            onBlur={(e) => setSelectedFolder(e.target.value)}
            className="block w-full py-2 pl-3 pr-10 mt-1 text-base leading-6 text-white transition duration-150 ease-in-out bg-gray-800 border-gray-700 rounded-md form-select focus:outline-none focus:ring-blue focus:border-blue-300 sm:text-sm sm:leading-5"
          >
            {isLoadingDetails && <option value="">Loading Folders...</option>}
            {!isLoadingDetails &&
              serverData &&
              serverData.rootFolders.map((folder) => (
                <option key={`profile-list${folder.id}`} value={folder.path}>
                  {folder.path}
                </option>
              ))}
          </select>
        </div>
      </div>
    </>
  );
};

export default AdvancedRequester;
