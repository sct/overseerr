import { InboxInIcon } from '@heroicons/react/solid';
import axios from 'axios';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import useSettings from '../../hooks/useSettings';
import globalMessages from '../../i18n/globalMessages';
import Alert from '../Common/Alert';
import Modal from '../Common/Modal';

interface PlexImportProps {
  onCancel?: () => void;
  onComplete?: () => void;
}

const messages = defineMessages({
  importfromplex: 'Import Plex Users',
  importfromplexerror: 'Something went wrong while importing Plex users.',
  importedfromplex:
    '<strong>{userCount}</strong> {userCount, plural, one {user} other {users}} Plex users imported successfully!',
  user: 'User',
  nouserstoimport: 'There are no Plex users to import.',
  newplexsigninenabled:
    'The <strong>Enable New Plex Sign-In</strong> setting is currently enabled. Plex users with library access do not need to be imported in order to sign in.',
});

const PlexImportModal: React.FC<PlexImportProps> = ({
  onCancel,
  onComplete,
}) => {
  const intl = useIntl();
  const settings = useSettings();
  const { addToast } = useToasts();
  const [isImporting, setImporting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { data, error } = useSWR<
    {
      id: string;
      title: string;
      username: string;
      email: string;
      thumb: string;
    }[]
  >(`/api/v1/settings/plex/users`, {
    revalidateOnMount: true,
  });

  const importUsers = async () => {
    setImporting(true);

    try {
      const { data: createdUsers } = await axios.post(
        '/api/v1/user/import-from-plex',
        { plexIds: selectedUsers }
      );

      if (!createdUsers.length) {
        throw new Error('No users were imported from Plex.');
      }

      addToast(
        intl.formatMessage(messages.importedfromplex, {
          userCount: createdUsers.length,
          strong: function strong(msg) {
            return <strong>{msg}</strong>;
          },
        }),
        {
          autoDismiss: true,
          appearance: 'success',
        }
      );

      if (onComplete) {
        onComplete();
      }
    } catch (e) {
      addToast(intl.formatMessage(messages.importfromplexerror), {
        autoDismiss: true,
        appearance: 'error',
      });
    } finally {
      setImporting(false);
    }
  };

  const isSelectedUser = (plexId: string): boolean =>
    selectedUsers.includes(plexId);

  const isAllUsers = (): boolean => selectedUsers.length === data?.length;

  const toggleUser = (plexId: string): void => {
    if (selectedUsers.includes(plexId)) {
      setSelectedUsers((users) => users.filter((user) => user !== plexId));
    } else {
      setSelectedUsers((users) => [...users, plexId]);
    }
  };

  const toggleAllUsers = (): void => {
    if (data && selectedUsers.length >= 0 && !isAllUsers()) {
      setSelectedUsers(data.map((user) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  return (
    <Modal
      loading={!data && !error}
      title={intl.formatMessage(messages.importfromplex)}
      iconSvg={<InboxInIcon />}
      onOk={() => {
        importUsers();
      }}
      okDisabled={isImporting || !selectedUsers.length}
      okText={intl.formatMessage(
        isImporting ? globalMessages.importing : globalMessages.import
      )}
      onCancel={onCancel}
    >
      {data?.length ? (
        <>
          {settings.currentSettings.newPlexLogin && (
            <Alert
              title={intl.formatMessage(messages.newplexsigninenabled, {
                strong: function strong(msg) {
                  return (
                    <strong className="font-semibold text-white">{msg}</strong>
                  );
                },
              })}
              type="info"
            />
          )}
          <div className="flex flex-col">
            <div className="-mx-4 sm:mx-0">
              <div className="inline-block min-w-full py-2 align-middle">
                <div className="overflow-hidden shadow sm:rounded-lg">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="w-16 px-4 py-3 bg-gray-500">
                          <span
                            role="checkbox"
                            tabIndex={0}
                            aria-checked={isAllUsers()}
                            onClick={() => toggleAllUsers()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Space') {
                                toggleAllUsers();
                              }
                            }}
                            className="relative inline-flex items-center justify-center flex-shrink-0 w-10 h-5 pt-2 cursor-pointer focus:outline-none"
                          >
                            <span
                              aria-hidden="true"
                              className={`${
                                isAllUsers() ? 'bg-indigo-500' : 'bg-gray-800'
                              } absolute h-4 w-9 mx-auto rounded-full transition-colors ease-in-out duration-200`}
                            ></span>
                            <span
                              aria-hidden="true"
                              className={`${
                                isAllUsers() ? 'translate-x-5' : 'translate-x-0'
                              } absolute left-0 inline-block h-5 w-5 border border-gray-200 rounded-full bg-white shadow transform group-focus:ring group-focus:border-blue-300 transition-transform ease-in-out duration-200`}
                            ></span>
                          </span>
                        </th>
                        <th className="px-1 py-3 text-xs font-medium leading-4 tracking-wider text-left text-gray-200 uppercase bg-gray-500 md:px-6">
                          {intl.formatMessage(messages.user)}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-600 divide-y divide-gray-700">
                      {data?.map((user) => (
                        <tr key={`user-${user.id}`}>
                          <td className="px-4 py-4 text-sm font-medium leading-5 text-gray-100 whitespace-nowrap">
                            <span
                              role="checkbox"
                              tabIndex={0}
                              aria-checked={isSelectedUser(user.id)}
                              onClick={() => toggleUser(user.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Space') {
                                  toggleUser(user.id);
                                }
                              }}
                              className="relative inline-flex items-center justify-center flex-shrink-0 w-10 h-5 pt-2 cursor-pointer focus:outline-none"
                            >
                              <span
                                aria-hidden="true"
                                className={`${
                                  isSelectedUser(user.id)
                                    ? 'bg-indigo-500'
                                    : 'bg-gray-800'
                                } absolute h-4 w-9 mx-auto rounded-full transition-colors ease-in-out duration-200`}
                              ></span>
                              <span
                                aria-hidden="true"
                                className={`${
                                  isSelectedUser(user.id)
                                    ? 'translate-x-5'
                                    : 'translate-x-0'
                                } absolute left-0 inline-block h-5 w-5 border border-gray-200 rounded-full bg-white shadow transform group-focus:ring group-focus:border-blue-300 transition-transform ease-in-out duration-200`}
                              ></span>
                            </span>
                          </td>
                          <td className="px-1 py-4 text-sm font-medium leading-5 text-gray-100 md:px-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                className="flex-shrink-0 w-10 h-10 rounded-full"
                                src={user.thumb}
                                alt=""
                              />
                              <div className="ml-4">
                                <div className="text-base font-bold leading-5">
                                  {user.username}
                                </div>
                                {user.username &&
                                  user.username.toLowerCase() !==
                                    user.email && (
                                    <div className="text-sm leading-5 text-gray-300">
                                      {user.email}
                                    </div>
                                  )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <Alert
          title={intl.formatMessage(messages.nouserstoimport)}
          type="info"
        />
      )}
    </Modal>
  );
};

export default PlexImportModal;
