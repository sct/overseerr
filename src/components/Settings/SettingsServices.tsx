import React, { useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import Badge from '../Common/Badge';
import Button from '../Common/Button';
import useSWR from 'swr';
import type {
  RadarrSettings,
  SonarrSettings,
} from '../../../server/lib/settings';
import LoadingSpinner from '../Common/LoadingSpinner';
import RadarrModal from './RadarrModal';
import Modal from '../Common/Modal';
import Transition from '../Transition';
import axios from 'axios';
import SonarrModal from './SonarrModal';
import Alert from '../Common/Alert';

const messages = defineMessages({
  radarrsettings: 'Radarr Settings',
  radarrSettingsDescription:
    'Configure your Radarr connection below. You can have multiple Radarr configurations but only two can be active as defaults at any time (one for standard HD and one for 4K). Administrators can override which server will be used when a new request is made.',
  sonarrsettings: 'Sonarr Settings',
  sonarrSettingsDescription:
    'Configure your Sonarr connection below. You can have multiple Sonarr configurations but only two can be active as defaults at any time (one for standard HD and one for 4K). Administrators can override which server will be used when a new request is made.',
  deleteserverconfirm: 'Are you sure you want to delete this server?',
  edit: 'Edit',
  delete: 'Delete',
  ssl: 'SSL',
  default: 'Default',
  default4k: 'Default 4K',
  address: 'Address',
  activeProfile: 'Active Profile',
  addradarr: 'Add Radarr Server',
  addsonarr: 'Add Sonarr Server',
  nodefault: 'No default server selected!',
  nodefaultdescription:
    'At least one server must be marked as default before any requests will make it to your services.',
  no4kimplemented: '(Default 4K servers are not currently implemented)',
});

interface ServerInstanceProps {
  name: string;
  isDefault?: boolean;
  isDefault4K?: boolean;
  address: string;
  isSSL?: boolean;
  profileName: string;
  isSonarr?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const ServerInstance: React.FC<ServerInstanceProps> = ({
  name,
  address,
  profileName,
  isDefault4K = false,
  isDefault = false,
  isSSL = false,
  isSonarr = false,
  onEdit,
  onDelete,
}) => {
  return (
    <li className="col-span-1 bg-gray-700 rounded-lg shadow">
      <div className="w-full flex items-center justify-between p-6 space-x-6">
        <div className="flex-1 truncate">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-white text-sm leading-5 font-medium truncate">
              {name}
            </h3>
            {isDefault && (
              <Badge>
                <FormattedMessage {...messages.default} />
              </Badge>
            )}
            {isDefault4K && (
              <Badge badgeType="warning">
                <FormattedMessage {...messages.default4k} />
              </Badge>
            )}
            {isSSL && (
              <Badge badgeType="success">
                <FormattedMessage {...messages.ssl} />
              </Badge>
            )}
          </div>
          <p className="mt-1 text-gray-300 text-sm leading-5 truncate">
            <span className="font-bold mr-2">
              <FormattedMessage {...messages.address} />
            </span>
            {address}
          </p>
          <p className="mt-1 text-gray-300 text-sm leading-5 truncate">
            <span className="font-bold mr-2">
              <FormattedMessage {...messages.activeProfile} />
            </span>{' '}
            {profileName}
          </p>
        </div>
        <img
          className="w-10 h-10 flex-shrink-0"
          src={`/images/${isSonarr ? 'sonarr' : 'radarr'}_logo.png`}
          alt=""
        />
      </div>
      <div className="border-t border-gray-800">
        <div className="-mt-px flex">
          <div className="w-0 flex-1 flex border-r border-gray-800">
            <button
              onClick={() => onEdit()}
              className="relative -mr-px w-0 flex-1 inline-flex items-center justify-center py-4 text-sm leading-5 text-gray-200 font-medium border border-transparent rounded-bl-lg hover:text-white focus:outline-none focus:ring-blue focus:border-gray-500 focus:z-10 transition ease-in-out duration-150"
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
                <FormattedMessage {...messages.edit} />
              </span>
            </button>
          </div>
          <div className="-ml-px w-0 flex-1 flex">
            <button
              onClick={() => onDelete()}
              className="relative w-0 flex-1 inline-flex items-center justify-center py-4 text-sm leading-5 text-gray-200 font-medium border border-transparent rounded-br-lg hover:text-white focus:outline-none focus:ring-blue focus:border-gray-500 focus:z-10 transition ease-in-out duration-150"
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
                <FormattedMessage {...messages.delete} />
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
  };

  return (
    <>
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-200">
          <FormattedMessage {...messages.radarrsettings} />
        </h3>
        <p className="mt-1 max-w-2xl text-sm leading-5 text-gray-500">
          <FormattedMessage {...messages.radarrSettingsDescription} />
        </p>
      </div>
      {editRadarrModal.open && (
        <RadarrModal
          radarr={editRadarrModal.radarr}
          onClose={() => setEditRadarrModal({ open: false, radarr: null })}
          onSave={() => {
            revalidateRadarr();
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
          <FormattedMessage {...messages.deleteserverconfirm} />
        </Modal>
      </Transition>
      <div className="mt-6 sm:mt-5">
        {!radarrData && !radarrError && <LoadingSpinner />}
        {radarrData && !radarrError && (
          <>
            {radarrData.length > 0 &&
              !radarrData.some(
                (radarr) => radarr.isDefault && !radarr.is4k
              ) && (
                <Alert title={intl.formatMessage(messages.nodefault)}>
                  <p>{intl.formatMessage(messages.nodefaultdescription)}</p>
                  <p className="mt-2">
                    {intl.formatMessage(messages.no4kimplemented)}
                  </p>
                </Alert>
              )}
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {radarrData.map((radarr) => (
                <ServerInstance
                  key={`radarr-config-${radarr.id}`}
                  name={radarr.name}
                  address={radarr.hostname}
                  profileName={radarr.activeProfileName}
                  isSSL={radarr.useSsl}
                  isDefault={radarr.isDefault && !radarr.is4k}
                  isDefault4K={radarr.is4k && radarr.isDefault}
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
              <li className="col-span-1 border-2 border-dashed border-gray-400 rounded-lg shadow h-32 sm:h-32">
                <div className="flex items-center justify-center w-full h-full">
                  <Button
                    buttonType="ghost"
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
                    <FormattedMessage {...messages.addradarr} />
                  </Button>
                </div>
              </li>
            </ul>
          </>
        )}
      </div>
      <div className="mt-10">
        <h3 className="text-lg leading-6 font-medium text-gray-200">
          <FormattedMessage {...messages.sonarrsettings} />
        </h3>
        <p className="mt-1 max-w-2xl text-sm leading-5 text-gray-500">
          <FormattedMessage {...messages.sonarrSettingsDescription} />
        </p>
      </div>
      <div className="mt-6 sm:mt-5">
        {!sonarrData && !sonarrError && <LoadingSpinner />}
        {sonarrData && !sonarrError && (
          <>
            {sonarrData.length > 0 &&
              !sonarrData.some(
                (sonarr) => sonarr.isDefault && !sonarr.is4k
              ) && (
                <Alert title={intl.formatMessage(messages.nodefault)}>
                  <p>{intl.formatMessage(messages.nodefaultdescription)}</p>
                  <p className="mt-2">
                    {intl.formatMessage(messages.no4kimplemented)}
                  </p>
                </Alert>
              )}
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sonarrData.map((sonarr) => (
                <ServerInstance
                  key={`sonarr-config-${sonarr.id}`}
                  name={sonarr.name}
                  address={sonarr.hostname}
                  profileName={sonarr.activeProfileName}
                  isSSL={sonarr.useSsl}
                  isSonarr
                  isDefault4K={sonarr.isDefault && sonarr.is4k}
                  isDefault={sonarr.isDefault && !sonarr.is4k}
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
              <li className="col-span-1 border-2 border-dashed border-gray-400 rounded-lg shadow h-32 sm:h-32">
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
                    <FormattedMessage {...messages.addsonarr} />
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
