import axios from 'axios';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR, { mutate } from 'swr';
import type {
  RadarrSettings,
  SonarrSettings,
} from '../../../server/lib/settings';
import globalMessages from '../../i18n/globalMessages';
import Alert from '../Common/Alert';
import Badge from '../Common/Badge';
import Button from '../Common/Button';
import LoadingSpinner from '../Common/LoadingSpinner';
import Modal from '../Common/Modal';
import PageTitle from '../Common/PageTitle';
import Transition from '../Transition';
import RadarrModal from './RadarrModal';
import SonarrModal from './SonarrModal';

const messages = defineMessages({
  services: 'Services',
  radarrsettings: 'Radarr Settings',
  sonarrsettings: 'Sonarr Settings',
  serviceSettingsDescription:
    'Configure your {serverType} server(s) below. You can connect multiple {serverType} servers, but only two of them can be marked as defaults (one non-4K and one 4K). Administrators are able to override the server used to process new requests prior to approval.',
  deleteserverconfirm: 'Are you sure you want to delete this server?',
  ssl: 'SSL',
  default: 'Default',
  default4k: 'Default 4K',
  address: 'Address',
  activeProfile: 'Active Profile',
  addradarr: 'Add Radarr Server',
  addsonarr: 'Add Sonarr Server',
  noDefaultServer:
    'At least one {serverType} server must be marked as default in order for {mediaType} requests to be processed.',
  noDefaultNon4kServer:
    'If you do not have separate {serverType} servers for non-4K content and 4K content, your {serverType} server should not be designated as a 4K server.',
  mediaTypeMovie: 'movie',
  mediaTypeSeries: 'series',
});

interface ServerInstanceProps {
  name: string;
  isDefault?: boolean;
  isDefault4K?: boolean;
  hostname: string;
  port: number;
  isSSL?: boolean;
  externalUrl?: string;
  profileName: string;
  isSonarr?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const ServerInstance: React.FC<ServerInstanceProps> = ({
  name,
  hostname,
  port,
  profileName,
  isDefault4K = false,
  isDefault = false,
  isSSL = false,
  isSonarr = false,
  externalUrl,
  onEdit,
  onDelete,
}) => {
  const intl = useIntl();

  const internalUrl =
    (isSSL ? 'https://' : 'http://') + hostname + ':' + String(port);
  const serviceUrl = externalUrl ?? internalUrl;

  return (
    <li className="col-span-1 bg-gray-700 rounded-lg shadow">
      <div className="flex items-center justify-between w-full p-6 space-x-6">
        <div className="flex-1 truncate">
          <div className="flex items-center mb-2 space-x-3">
            <h3 className="font-medium leading-5 text-white truncate">
              <a
                href={serviceUrl}
                className="transition duration-300 hover:underline hover:text-white"
              >
                {name}
              </a>
            </h3>
            {isDefault && <Badge>{intl.formatMessage(messages.default)}</Badge>}
            {isDefault4K && (
              <Badge badgeType="warning">
                {intl.formatMessage(messages.default4k)}
              </Badge>
            )}
            {isSSL && (
              <Badge badgeType="success">
                {intl.formatMessage(messages.ssl)}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm leading-5 text-gray-300 truncate">
            <span className="mr-2 font-bold">
              {intl.formatMessage(messages.address)}
            </span>
            <a
              href={internalUrl}
              className="transition duration-300 hover:underline hover:text-white"
            >
              {internalUrl}
            </a>
          </p>
          <p className="mt-1 text-sm leading-5 text-gray-300 truncate">
            <span className="mr-2 font-bold">
              {intl.formatMessage(messages.activeProfile)}
            </span>
            {profileName}
          </p>
        </div>
        <a href={serviceUrl} className="opacity-50 hover:opacity-100">
          <img
            className="flex-shrink-0 w-10 h-10"
            src={`/images/${isSonarr ? 'sonarr' : 'radarr'}_logo.svg`}
            alt={isSonarr ? 'Sonarr' : 'Radarr'}
          />
        </a>
      </div>
      <div className="border-t border-gray-800">
        <div className="flex -mt-px">
          <div className="flex flex-1 w-0 border-r border-gray-800">
            <button
              onClick={() => onEdit()}
              className="relative inline-flex items-center justify-center flex-1 w-0 py-4 -mr-px text-sm font-medium leading-5 text-gray-200 transition duration-150 ease-in-out border border-transparent rounded-bl-lg hover:text-white focus:outline-none focus:ring-blue focus:border-gray-500 focus:z-10"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              <span className="ml-3">
                {intl.formatMessage(globalMessages.edit)}
              </span>
            </button>
          </div>
          <div className="flex flex-1 w-0 -ml-px">
            <button
              onClick={() => onDelete()}
              className="relative inline-flex items-center justify-center flex-1 w-0 py-4 text-sm font-medium leading-5 text-gray-200 transition duration-150 ease-in-out border border-transparent rounded-br-lg hover:text-white focus:outline-none focus:ring-blue focus:border-gray-500 focus:z-10"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-3">
                {intl.formatMessage(globalMessages.delete)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </li>
  );
};

const SettingsServices: React.FC = () => {
  const intl = useIntl();
  const {
    data: radarrData,
    error: radarrError,
    revalidate: revalidateRadarr,
  } = useSWR<RadarrSettings[]>('/api/v1/settings/radarr');
  const {
    data: sonarrData,
    error: sonarrError,
    revalidate: revalidateSonarr,
  } = useSWR<SonarrSettings[]>('/api/v1/settings/sonarr');
  const [editRadarrModal, setEditRadarrModal] = useState<{
    open: boolean;
    radarr: RadarrSettings | null;
  }>({
    open: false,
    radarr: null,
  });
  const [editSonarrModal, setEditSonarrModal] = useState<{
    open: boolean;
    sonarr: SonarrSettings | null;
  }>({
    open: false,
    sonarr: null,
  });
  const [deleteServerModal, setDeleteServerModal] = useState<{
    open: boolean;
    type: 'radarr' | 'sonarr';
    serverId: number | null;
  }>({
    open: false,
    type: 'radarr',
    serverId: null,
  });

  const deleteServer = async () => {
    await axios.delete(
      `/api/v1/settings/${deleteServerModal.type}/${deleteServerModal.serverId}`
    );
    setDeleteServerModal({ open: false, serverId: null, type: 'radarr' });
    revalidateRadarr();
    revalidateSonarr();
    mutate('/api/v1/settings/public');
  };

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.services),
          intl.formatMessage(globalMessages.settings),
        ]}
      />
      <div className="mb-6">
        <h3 className="heading">
          {intl.formatMessage(messages.radarrsettings)}
        </h3>
        <p className="description">
          {intl.formatMessage(messages.serviceSettingsDescription, {
            serverType: 'Radarr',
          })}
        </p>
      </div>
      {editRadarrModal.open && (
        <RadarrModal
          radarr={editRadarrModal.radarr}
          onClose={() => setEditRadarrModal({ open: false, radarr: null })}
          onSave={() => {
            revalidateRadarr();
            mutate('/api/v1/settings/public');
            setEditRadarrModal({ open: false, radarr: null });
          }}
        />
      )}
      {editSonarrModal.open && (
        <SonarrModal
          sonarr={editSonarrModal.sonarr}
          onClose={() => setEditSonarrModal({ open: false, sonarr: null })}
          onSave={() => {
            revalidateSonarr();
            mutate('/api/v1/settings/public');
            setEditSonarrModal({ open: false, sonarr: null });
          }}
        />
      )}
      <Transition
        show={deleteServerModal.open}
        enter="transition ease-in-out duration-300 transform opacity-0"
        enterFrom="opacity-0"
        enterTo="opacuty-100"
        leave="transition ease-in-out duration-300 transform opacity-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <Modal
          okText="Delete"
          okButtonType="danger"
          onOk={() => deleteServer()}
          onCancel={() =>
            setDeleteServerModal({
              open: false,
              serverId: null,
              type: 'radarr',
            })
          }
          title="Delete Server"
        >
          {intl.formatMessage(messages.deleteserverconfirm)}
        </Modal>
      </Transition>
      <div className="section">
        {!radarrData && !radarrError && <LoadingSpinner />}
        {radarrData && !radarrError && (
          <>
            {radarrData.length > 0 &&
              (!radarrData.some((radarr) => radarr.isDefault) ? (
                <Alert
                  title={intl.formatMessage(messages.noDefaultServer, {
                    serverType: 'Radarr',
                    mediaType: intl.formatMessage(messages.mediaTypeMovie),
                  })}
                />
              ) : (
                !radarrData.some(
                  (radarr) => radarr.isDefault && !radarr.is4k
                ) && (
                  <Alert
                    title={intl.formatMessage(messages.noDefaultNon4kServer, {
                      serverType: 'Radarr',
                    })}
                  />
                )
              ))}
            <ul className="grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {radarrData.map((radarr) => (
                <ServerInstance
                  key={`radarr-config-${radarr.id}`}
                  name={radarr.name}
                  hostname={radarr.hostname}
                  port={radarr.port}
                  profileName={radarr.activeProfileName}
                  isSSL={radarr.useSsl}
                  isDefault={radarr.isDefault && !radarr.is4k}
                  isDefault4K={radarr.is4k && radarr.isDefault}
                  externalUrl={radarr.externalUrl}
                  onEdit={() => setEditRadarrModal({ open: true, radarr })}
                  onDelete={() =>
                    setDeleteServerModal({
                      open: true,
                      serverId: radarr.id,
                      type: 'radarr',
                    })
                  }
                />
              ))}
              <li className="h-32 col-span-1 border-2 border-gray-400 border-dashed rounded-lg shadow sm:h-44">
                <div className="flex items-center justify-center w-full h-full">
                  <Button
                    buttonType="ghost"
                    className="mt-3 mb-3"
                    onClick={() =>
                      setEditRadarrModal({ open: true, radarr: null })
                    }
                  >
                    <svg
                      className="w-5 h-5 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {intl.formatMessage(messages.addradarr)}
                  </Button>
                </div>
              </li>
            </ul>
          </>
        )}
      </div>
      <div className="mt-10 mb-6">
        <h3 className="heading">
          {intl.formatMessage(messages.sonarrsettings)}
        </h3>
        <p className="description">
          {intl.formatMessage(messages.serviceSettingsDescription, {
            serverType: 'Sonarr',
          })}
        </p>
      </div>
      <div className="section">
        {!sonarrData && !sonarrError && <LoadingSpinner />}
        {sonarrData && !sonarrError && (
          <>
            {sonarrData.length > 0 &&
              (!sonarrData.some((sonarr) => sonarr.isDefault) ? (
                <Alert
                  title={intl.formatMessage(messages.noDefaultServer, {
                    serverType: 'Sonarr',
                    mediaType: intl.formatMessage(messages.mediaTypeSeries),
                  })}
                />
              ) : (
                !sonarrData.some(
                  (sonarr) => sonarr.isDefault && !sonarr.is4k
                ) && (
                  <Alert
                    title={intl.formatMessage(messages.noDefaultNon4kServer, {
                      serverType: 'Sonarr',
                    })}
                  />
                )
              ))}
            <ul className="grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {sonarrData.map((sonarr) => (
                <ServerInstance
                  key={`sonarr-config-${sonarr.id}`}
                  name={sonarr.name}
                  hostname={sonarr.hostname}
                  port={sonarr.port}
                  profileName={sonarr.activeProfileName}
                  isSSL={sonarr.useSsl}
                  isSonarr
                  isDefault4K={sonarr.isDefault && sonarr.is4k}
                  isDefault={sonarr.isDefault && !sonarr.is4k}
                  externalUrl={sonarr.externalUrl}
                  onEdit={() => setEditSonarrModal({ open: true, sonarr })}
                  onDelete={() =>
                    setDeleteServerModal({
                      open: true,
                      serverId: sonarr.id,
                      type: 'sonarr',
                    })
                  }
                />
              ))}
              <li className="h-32 col-span-1 border-2 border-gray-400 border-dashed rounded-lg shadow sm:h-44">
                <div className="flex items-center justify-center w-full h-full">
                  <Button
                    buttonType="ghost"
                    onClick={() =>
                      setEditSonarrModal({ open: true, sonarr: null })
                    }
                  >
                    <svg
                      className="w-5 h-5 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {intl.formatMessage(messages.addsonarr)}
                  </Button>
                </div>
              </li>
            </ul>
          </>
        )}
      </div>
    </>
  );
};

export default SettingsServices;
