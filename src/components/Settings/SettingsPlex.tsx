import React, { useState } from 'react';
import LoadingSpinner from '../Common/LoadingSpinner';
import type { PlexSettings } from '../../../server/lib/settings';
import useSWR from 'swr';
import { useFormik } from 'formik';
import Button from '../Common/Button';
import axios from 'axios';
import LibraryItem from './LibraryItem';

const SettingsPlex: React.FC = () => {
  const { data, error, revalidate } = useSWR<PlexSettings>(
    '/api/v1/settings/plex'
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formik = useFormik({
    initialValues: {
      hostname: data?.ip,
      port: data?.port,
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      setIsUpdating(true);
      try {
        await axios.post('/api/v1/settings/plex', {
          ip: values.hostname,
          port: values.port,
        } as PlexSettings);

        revalidate();
      } catch (e) {
        setSubmitError(e.message);
      } finally {
        setIsUpdating(false);
      }
    },
  });

  const activeLibraries =
    data?.libraries
      .filter((library) => library.enabled)
      .map((library) => library.id) ?? [];

  const syncLibraries = async () => {
    setIsSyncing(true);
    await axios.get('/api/v1/settings/plex/library', {
      params: {
        sync: true,
        enable:
          activeLibraries.length > 0 ? activeLibraries.join(',') : undefined,
      },
    });
    setIsSyncing(false);
    revalidate();
  };

  const toggleLibrary = async (libraryId: string) => {
    setIsSyncing(true);
    if (activeLibraries.includes(libraryId)) {
      await axios.get('/api/v1/settings/plex/library', {
        params: {
          enable:
            activeLibraries.length > 0
              ? activeLibraries.filter((id) => id !== libraryId).join(',')
              : undefined,
        },
      });
    } else {
      await axios.get('/api/v1/settings/plex/library', {
        params: {
          enable: [...activeLibraries, libraryId].join(','),
        },
      });
    }
    setIsSyncing(false);
    revalidate();
  };

  if (!data && !error) {
    return <LoadingSpinner />;
  }
  return (
    <>
      <div>
        <h3 className="text-lg leading-6 font-medium text-cool-gray-200">
          Plex Settings
        </h3>
        <p className="mt-1 max-w-2xl text-sm leading-5 text-cool-gray-500">
          Configure the settings for your Plex server. Overseerr uses your Plex
          server to scan your library at an interval and see what content is
          available.
        </p>
      </div>
      <form onSubmit={formik.handleSubmit}>
        <div className="mt-6 sm:mt-5">
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
            <label
              htmlFor="name"
              className="block text-sm font-medium leading-5 text-cool-gray-400 sm:mt-px sm:pt-2"
            >
              Server Name (Automatically set)
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <div className="max-w-lg flex rounded-md shadow-sm">
                <input
                  id="name"
                  name="name"
                  placeholder="Plex Server Name (will be set automatically)"
                  value={data?.name}
                  readOnly
                  className="flex-1 form-input block w-full min-w-0 rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-cool-gray-700 border border-cool-gray-500"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800 sm:pt-5">
            <label
              htmlFor="hostname"
              className="block text-sm font-medium leading-5 text-cool-gray-400 sm:mt-px sm:pt-2"
            >
              Hostname/IP
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <div className="max-w-lg flex rounded-md shadow-sm">
                <input
                  id="hostname"
                  name="hostname"
                  placeholder="127.0.0.1"
                  value={formik.values.hostname}
                  onChange={formik.handleChange}
                  className="flex-1 form-input block w-full min-w-0 rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-cool-gray-700 border border-cool-gray-500"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label
              htmlFor="port"
              className="block text-sm font-medium leading-5 text-cool-gray-400 sm:mt-px sm:pt-2"
            >
              Port
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <div className="max-w-lg rounded-md shadow-sm sm:max-w-xs">
                <input
                  id="port"
                  name="port"
                  placeholder="32400"
                  value={formik.values.port}
                  onChange={formik.handleChange}
                  className="form-input block w-24 transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-cool-gray-700 border border-cool-gray-500"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-cool-gray-700 pt-5">
          <div className="flex justify-end">
            <span className="ml-3 inline-flex rounded-md shadow-sm">
              <Button buttonType="primary" type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </span>
          </div>
        </div>
        <div className="mt-10">
          <h3 className="text-lg leading-6 font-medium text-cool-gray-200">
            Plex Libraries
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-cool-gray-500">
            These are the libraries Overseerr will scan for titles. If you see
            no libraries listed, you will need to run at least one sync by
            clicking the button below. You must first configure and save your
            plex connection settings before you will be able to retrieve your
            libraries.
          </p>
          <div className="mt-6">
            <Button onClick={() => syncLibraries()} disabled={isSyncing}>
              <svg
                className={`${isSyncing ? 'animate-spin' : ''} w-5 h-5 mr-1`}
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
              {isSyncing ? 'Syncing...' : 'Sync Plex Libraries'}
            </Button>
          </div>
          <ul className="mt-6 grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data?.libraries.map((library) => (
              <LibraryItem
                name={library.name}
                isEnabled={library.enabled}
                key={`setting-library-${library.id}`}
                onToggle={() => toggleLibrary(library.id)}
              />
            ))}
          </ul>
        </div>
      </form>
    </>
  );
};

export default SettingsPlex;
