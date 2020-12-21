import React, { useState } from 'react';
import type { MediaRequest } from '../../../server/entity/MediaRequest';
import { FormattedDate, useIntl, defineMessages } from 'react-intl';
import Badge from '../Common/Badge';
import { MediaRequestStatus } from '../../../server/constants/media';
import Button from '../Common/Button';
import axios from 'axios';
import globalMessages from '../../i18n/globalMessages';

const messages = defineMessages({
  seasons: 'Seasons',
});

interface RequestBlockProps {
  request: MediaRequest;
  onUpdate?: () => void;
}

const RequestBlock: React.FC<RequestBlockProps> = ({ request, onUpdate }) => {
  const intl = useIntl();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateRequest = async (type: 'approve' | 'decline'): Promise<void> => {
    setIsUpdating(true);
    await axios.get(`/api/v1/request/${request.id}/${type}`);

    if (onUpdate) {
      onUpdate();
    }
    setIsUpdating(false);
  };

  const deleteRequest = async () => {
    setIsUpdating(true);
    await axios.delete(`/api/v1/request/${request.id}`);

    if (onUpdate) {
      onUpdate();
    }

    setIsUpdating(false);
  };

  return (
    <div className="block">
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="mr-6 flex-col items-center text-sm leading-5 text-gray-300 flex-1 min-w-0">
            <div className="flex flex-nowrap mb-1 white">
              <svg
                className="min-w-0 flex-shrink-0 mr-1.5 h-5 w-5 text-gray-300"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="truncate w-40 md:w-auto">
                {request.requestedBy.username}
              </span>
            </div>
            {request.modifiedBy && (
              <div className="flex flex-nowrap">
                <svg
                  className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="truncate w-40 md:w-auto">
                  {request.modifiedBy?.username}
                </span>
              </div>
            )}
          </div>
          <div className="ml-2 flex-shrink-0 flex flex-wrap">
            {request.status === MediaRequestStatus.PENDING && (
              <>
                <span className="mr-1">
                  <Button
                    buttonType="success"
                    onClick={() => updateRequest('approve')}
                    disabled={isUpdating}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                </span>
                <span>
                  <Button
                    buttonType="danger"
                    onClick={() => updateRequest('decline')}
                    disabled={isUpdating}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                </span>
              </>
            )}
            {request.status !== MediaRequestStatus.PENDING && (
              <Button
                buttonType="danger"
                onClick={() => deleteRequest()}
                disabled={isUpdating}
              >
                <svg
                  className="w-4 h-4"
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
              </Button>
            )}
          </div>
        </div>
        <div className="mt-2 sm:flex sm:justify-between">
          <div className="sm:flex">
            <div className="mr-6 flex items-center text-sm leading-5 text-gray-300">
              {request.status === MediaRequestStatus.AVAILABLE && (
                <Badge badgeType="success">
                  {intl.formatMessage(globalMessages.available)}
                </Badge>
              )}
              {request.status === MediaRequestStatus.APPROVED && (
                <Badge badgeType="success">
                  {intl.formatMessage(globalMessages.approved)}
                </Badge>
              )}
              {request.status === MediaRequestStatus.DECLINED && (
                <Badge badgeType="danger">
                  {intl.formatMessage(globalMessages.declined)}
                </Badge>
              )}
              {request.status === MediaRequestStatus.PENDING && (
                <Badge badgeType="warning">
                  {intl.formatMessage(globalMessages.pending)}
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm leading-5 text-gray-300 sm:mt-0">
            <svg
              className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-300"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              <FormattedDate value={request.createdAt} />
            </span>
          </div>
        </div>
        {(request.seasons ?? []).length > 0 && (
          <div className="mt-2 text-sm flex flex-col">
            <div className="mb-2">{intl.formatMessage(messages.seasons)}</div>
            <div>
              {request.seasons.map((season) => (
                <span
                  key={`season-${season.id}`}
                  className="mr-2 mb-1 inline-block"
                >
                  <Badge>{season.seasonNumber}</Badge>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestBlock;
