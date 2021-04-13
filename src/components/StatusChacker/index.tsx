import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
import { StatusResponse } from '../../../server/interfaces/api/settingsInterfaces';
import Modal from '../Common/Modal';
import Transition from '../Transition';

const messages = defineMessages({
  newversionavailable: 'Application Update',
  newversionDescription:
    'Overseerr has been updated! Please click the button below to reload the page.',
  reloadOverseerr: 'Reload',
});

const StatusChecker: React.FC = () => {
  const intl = useIntl();
  const { data, error } = useSWR<StatusResponse>('/api/v1/status', {
    refreshInterval: 60 * 1000,
  });

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
      show={data.commitTag !== process.env.commitTag}
    >
      <Modal
        iconSvg={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
        }
        title={intl.formatMessage(messages.newversionavailable)}
        onOk={() => location.reload()}
        okText={intl.formatMessage(messages.reloadOverseerr)}
        backgroundClickable={false}
      >
        {intl.formatMessage(messages.newversionDescription)}
      </Modal>
    </Transition>
  );
};

export default StatusChecker;
