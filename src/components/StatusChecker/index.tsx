import { RefreshIcon, SparklesIcon } from '@heroicons/react/outline';
import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
import type { StatusResponse } from '../../../server/interfaces/api/settingsInterfaces';
import useSettings from '../../hooks/useSettings';
import { Permission, useUser } from '../../hooks/useUser';
import globalMessages from '../../i18n/globalMessages';
import Modal from '../Common/Modal';
import Transition from '../Transition';

const messages = defineMessages({
  appUpdated: '{applicationTitle} Updated',
  appUpdatedDescription:
    'Please click the button below to reload the application.',
  reloadApp: 'Reload {applicationTitle}',
  restartRequired: 'Server Restart Required',
  restartRequiredDescription:
    'Please restart the server to apply the updated settings.',
});

const StatusChecker = () => {
  const intl = useIntl();
  const settings = useSettings();
  const { hasPermission } = useUser();
  const { data, error } = useSWR<StatusResponse>('/api/v1/status', {
    refreshInterval: 60 * 1000,
  });
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    if (!data?.restartRequired) {
      setAlertDismissed(false);
    }
  }, [data?.restartRequired]);

  if (!data && !error) {
    return null;
  }

  if (!data) {
    return null;
  }

  return (
    <Transition
      enter="opacity-0 transition duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="opacity-100 transition duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      appear
      show={
        !alertDismissed &&
        ((hasPermission(Permission.ADMIN) && data.restartRequired) ||
          data.commitTag !== process.env.commitTag)
      }
    >
      {hasPermission(Permission.ADMIN) && data.restartRequired ? (
        <Modal
          iconSvg={<RefreshIcon />}
          title={intl.formatMessage(messages.restartRequired)}
          backgroundClickable={false}
          onOk={() => {
            setAlertDismissed(true);
            if (data.commitTag !== process.env.commitTag) {
              location.reload();
            }
          }}
          okText={intl.formatMessage(globalMessages.close)}
        >
          {intl.formatMessage(messages.restartRequiredDescription)}
        </Modal>
      ) : (
        <Modal
          iconSvg={<SparklesIcon />}
          title={intl.formatMessage(messages.appUpdated, {
            applicationTitle: settings.currentSettings.applicationTitle,
          })}
          onOk={() => location.reload()}
          okText={intl.formatMessage(messages.reloadApp, {
            applicationTitle: settings.currentSettings.applicationTitle,
          })}
          backgroundClickable={false}
        >
          {intl.formatMessage(messages.appUpdatedDescription)}
        </Modal>
      )}
    </Transition>
  );
};

export default StatusChecker;
