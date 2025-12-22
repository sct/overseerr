import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import Modal from '@app/components/Common/Modal';
import PageTitle from '@app/components/Common/PageTitle';
import LibraryItem from '@app/components/Settings/LibraryItem';
import PlexServerModal from '@app/components/Settings/PlexServerModal';
import globalMessages from '@app/i18n/globalMessages';
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import type { PlexSettings } from '@server/lib/settings';
import axios from 'axios';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR, { mutate } from 'swr';

const messages = defineMessages({
  plexservers: 'Plex Servers',
  plexsettingsDescription:
    'Configure your Plex server(s) below. Overseerr scans your Plex libraries to determine content availability. Users will be granted access if they have access to any configured server.',
  deleteserverconfirm: 'Are you sure you want to delete this server?',
  ssl: 'SSL',
  address: 'Address',
  libraries: 'Libraries',
  addplex: 'Add Plex Server',
  deletePlexServer: 'Delete Plex Server',
  syncing: 'Syncing…',
  syncLibraries: 'Sync Libraries',
  noServersConfigured: 'No Plex servers configured.',
  noServersConfiguredDescription:
    'Add a Plex server to enable media scanning and user authentication.',
});

interface PlexServerInstanceProps {
  server: PlexSettings;
  onEdit: () => void;
  onDelete: () => void;
  onSync: () => void;
  onToggleLibrary: (libraryId: string) => void;
  isSyncing: boolean;
}

const PlexServerInstance = ({
  server,
  onEdit,
  onDelete,
  onSync,
  onToggleLibrary,
  isSyncing,
}: PlexServerInstanceProps) => {
  const intl = useIntl();
  const [showLibraries, setShowLibraries] = useState(false);

  const internalUrl =
    (server.useSsl ? 'https://' : 'http://') +
    server.ip +
    ':' +
    String(server.port);
  const serviceUrl = server.webAppUrl ?? internalUrl;
  const enabledLibraries = server.libraries.filter((lib) => lib.enabled);

  return (
    <li className="col-span-1 rounded-lg bg-gray-800 shadow ring-1 ring-gray-500">
      <div className="flex w-full items-center justify-between space-x-4 p-6">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="break-words font-medium leading-5 text-white">
              <a
                href={serviceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition duration-300 hover:text-white hover:underline"
              >
                {server.name || 'Unnamed Server'}
              </a>
            </h3>
            {server.useSsl && (
              <Badge badgeType="success">
                {intl.formatMessage(messages.ssl)}
              </Badge>
            )}
          </div>
          <p className="mt-1 break-all text-sm leading-5 text-gray-300">
            <span className="mr-2 font-bold">
              {intl.formatMessage(messages.address)}
            </span>
            <a
              href={internalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition duration-300 hover:text-white hover:underline"
            >
              {internalUrl}
            </a>
          </p>
          <button
            onClick={() => setShowLibraries(!showLibraries)}
            className="mt-1 flex items-center text-sm leading-5 text-gray-300 hover:text-white"
          >
            <span className="mr-2 font-bold">
              {intl.formatMessage(messages.libraries)}
            </span>
            <span className="text-indigo-400">
              {enabledLibraries.length}/{server.libraries.length} enabled
            </span>
            {showLibraries ? (
              <ChevronUpIcon className="ml-1 h-4 w-4" />
            ) : (
              <ChevronDownIcon className="ml-1 h-4 w-4" />
            )}
          </button>
        </div>
        <div className="flex flex-shrink-0 items-center">
          <Button
            buttonType="ghost"
            onClick={onSync}
            disabled={isSyncing}
            className="mr-2"
          >
            <ArrowPathIcon
              className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </div>
      {showLibraries && server.libraries.length > 0 && (
        <div className="border-t border-gray-500 p-4">
          <ul className="grid grid-cols-1 gap-2">
            {server.libraries.map((library) => (
              <LibraryItem
                key={`lib-${server.id}-${library.id}`}
                name={library.name}
                isEnabled={library.enabled}
                onToggle={() => onToggleLibrary(library.id)}
              />
            ))}
          </ul>
        </div>
      )}
      <div className="border-t border-gray-500">
        <div className="-mt-px flex">
          <div className="flex w-0 flex-1 border-r border-gray-500">
            <button
              onClick={() => onEdit()}
              className="focus:ring-blue relative -mr-px inline-flex w-0 flex-1 items-center justify-center rounded-bl-lg border border-transparent py-4 text-sm font-medium leading-5 text-gray-200 transition duration-150 ease-in-out hover:text-white focus:z-10 focus:border-gray-500 focus:outline-none"
            >
              <PencilIcon className="mr-2 h-5 w-5" />
              <span>{intl.formatMessage(globalMessages.edit)}</span>
            </button>
          </div>
          <div className="-ml-px flex w-0 flex-1">
            <button
              onClick={() => onDelete()}
              className="focus:ring-blue relative inline-flex w-0 flex-1 items-center justify-center rounded-br-lg border border-transparent py-4 text-sm font-medium leading-5 text-gray-200 transition duration-150 ease-in-out hover:text-white focus:z-10 focus:border-gray-500 focus:outline-none"
            >
              <TrashIcon className="mr-2 h-5 w-5" />
              <span>{intl.formatMessage(globalMessages.delete)}</span>
            </button>
          </div>
        </div>
      </div>
    </li>
  );
};

interface SettingsPlexServersProps {
  onComplete?: () => void;
}

const SettingsPlexServers = ({ onComplete }: SettingsPlexServersProps) => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const {
    data: plexServers,
    error,
    mutate: revalidatePlex,
  } = useSWR<PlexSettings[]>('/api/v1/settings/plex');
  const [editPlexModal, setEditPlexModal] = useState<{
    open: boolean;
    plex: PlexSettings | null;
  }>({
    open: false,
    plex: null,
  });
  const [deleteServerModal, setDeleteServerModal] = useState<{
    open: boolean;
    serverId: number | null;
  }>({
    open: false,
    serverId: null,
  });
  const [syncingServer, setSyncingServer] = useState<number | null>(null);

  const deleteServer = async () => {
    if (deleteServerModal.serverId === null) return;

    await axios.delete(`/api/v1/settings/plex/${deleteServerModal.serverId}`);

    setDeleteServerModal({ open: false, serverId: null });
    revalidatePlex();
    mutate('/api/v1/settings/plex');
  };

  const syncLibraries = async (serverId: number) => {
    setSyncingServer(serverId);
    try {
      await axios.post(`/api/v1/settings/plex/${serverId}/libraries/sync`, {});
      revalidatePlex();
      addToast('Libraries synced successfully!', {
        appearance: 'success',
        autoDismiss: true,
      });
    } catch (e) {
      addToast('Failed to sync libraries.', {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      setSyncingServer(null);
    }
  };

  const toggleLibrary = async (serverId: number, libraryId: string) => {
    try {
      await axios.put(
        `/api/v1/settings/plex/${serverId}/libraries/${libraryId}`,
        {} // Empty body to satisfy OpenAPI validator
      );
      revalidatePlex();
    } catch (e) {
      addToast('Failed to toggle library.', {
        appearance: 'error',
        autoDismiss: true,
      });
    }
  };

  return (
    <>
      <PageTitle title={[intl.formatMessage(messages.plexservers)]} />
      {editPlexModal.open && (
        <PlexServerModal
          plex={editPlexModal.plex}
          isFirstServer={
            // First server: no servers exist (adding first), OR editing the primary server (id=0)
            !plexServers ||
            plexServers.length === 0 ||
            editPlexModal.plex?.id === 0
          }
          onClose={() => setEditPlexModal({ open: false, plex: null })}
          onSave={() => {
            revalidatePlex();
            mutate('/api/v1/settings/plex');
            setEditPlexModal({ open: false, plex: null });
            if (onComplete) {
              onComplete();
            }
          }}
        />
      )}
      {deleteServerModal.open && (
        <Modal
          onOk={deleteServer}
          okText={intl.formatMessage(globalMessages.delete)}
          okButtonType="danger"
          onCancel={() => setDeleteServerModal({ open: false, serverId: null })}
          title={intl.formatMessage(messages.deletePlexServer)}
        >
          {intl.formatMessage(messages.deleteserverconfirm)}
        </Modal>
      )}
      <div className="mb-6">
        <h3 className="heading">{intl.formatMessage(messages.plexservers)}</h3>
        <p className="description">
          {intl.formatMessage(messages.plexsettingsDescription)}
        </p>
      </div>
      {!plexServers && !error && <LoadingSpinner />}
      {plexServers && !error && (
        <>
          {plexServers.length === 0 && (
            <div className="mb-6 rounded-lg bg-gray-800 p-6 text-center">
              <p className="text-lg text-gray-300">
                {intl.formatMessage(messages.noServersConfigured)}
              </p>
              <p className="mt-2 text-sm text-gray-400">
                {intl.formatMessage(messages.noServersConfiguredDescription)}
              </p>
            </div>
          )}
          <ul className="grid max-w-6xl grid-cols-1 items-start gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {plexServers.map((plex) => (
              <PlexServerInstance
                key={`plex-config-${plex.id}`}
                server={plex}
                onEdit={() => setEditPlexModal({ open: true, plex })}
                onDelete={() =>
                  setDeleteServerModal({
                    open: true,
                    serverId: plex.id,
                  })
                }
                onSync={() => syncLibraries(plex.id)}
                onToggleLibrary={(libraryId) =>
                  toggleLibrary(plex.id, libraryId)
                }
                isSyncing={syncingServer === plex.id}
              />
            ))}
            <li className="col-span-1 h-32 rounded-lg border-2 border-dashed border-gray-400 shadow sm:h-44">
              <div className="flex h-full w-full items-center justify-center">
                <Button
                  buttonType="ghost"
                  onClick={() => setEditPlexModal({ open: true, plex: null })}
                >
                  <PlusIcon />
                  <span>{intl.formatMessage(messages.addplex)}</span>
                </Button>
              </div>
            </li>
          </ul>
        </>
      )}
    </>
  );
};

export default SettingsPlexServers;
