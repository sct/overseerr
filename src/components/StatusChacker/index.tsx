import React from 'react';
import useSWR from 'swr';
import Modal from '../Common/Modal';
import Transition from '../Transition';

const StatusChecker: React.FC = () => {
  const { data, error } = useSWR<{ version: string; commitTag: string }>(
    '/api/v1/status',
    {
      refreshInterval: 60 * 1000,
    }
  );

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
        title="New Version Available"
        onOk={() => location.reload()}
        okText="Reload Overseerr"
        backgroundClickable={false}
      >
        An update is now available. Click the button below to reload the
        application.
      </Modal>
    </Transition>
  );
};

export default StatusChecker;
