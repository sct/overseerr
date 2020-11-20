import React, { useState } from 'react';
import { FormattedMessage, useIntl, defineMessages } from 'react-intl';
import Button from '../Common/Button';
import { MediaRequest } from '../../../server/entity/MediaRequest';
import axios from 'axios';

const messages = defineMessages({
  pendingtitle: 'Pending Request',
  pendingdescription:
    'This title was requested by {username} ({email}) on {date}',
  approve: 'Approve',
  decline: 'Decline',
});

interface PendingRequestProps {
  request: MediaRequest;
  onUpdate: () => void;
}

const PendingRequest: React.FC<PendingRequestProps> = ({
  request,
  onUpdate,
}) => {
  const intl = useIntl();
  const [isLoading, setLoading] = useState(false);

  const updateStatus = async (status: 'approve' | 'decline') => {
    setLoading(true);
    const response = await axios.get(`/api/v1/request/${request.id}/${status}`);

    if (response.data) {
      onUpdate();
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 sm:rounded-lg mb-6 shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-100">
          <FormattedMessage {...messages.pendingtitle} />
        </h3>
        <div className="mt-2 max-w-xl text-sm leading-5 text-gray-400">
          <p>
            <FormattedMessage
              {...messages.pendingdescription}
              values={{
                username: request.requestedBy.username,
                email: request.requestedBy.email,
                date: intl.formatDate(request.updatedAt),
              }}
            />
          </p>
        </div>
        <div className="mt-5">
          <span className="inline-flex rounded-md shadow-sm mr-2">
            <Button
              buttonType="success"
              disabled={isLoading}
              onClick={() => updateStatus('approve')}
            >
              <svg
                className="w-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <FormattedMessage {...messages.approve} />
            </Button>
          </span>
          <span className="inline-flex rounded-md shadow-sm">
            <Button
              buttonType="danger"
              disabled={isLoading}
              onClick={() => updateStatus('decline')}
            >
              <svg
                className="w-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <FormattedMessage {...messages.decline} />
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
};

export default PendingRequest;
