import React, { useState } from 'react';
import type { MediaType } from '../../../server/models/Search';
import Available from '../../assets/available.svg';
import Requested from '../../assets/requested.svg';
import Unavailable from '../../assets/unavailable.svg';
import { withProperties } from '../../utils/typeHelpers';
import Transition from '../Transition';
import Placeholder from './Placeholder';
import Modal from '../Common/Modal';
import { useUser, Permission } from '../../hooks/useUser';
import axios from 'axios';
import { MediaRequest } from '../../../server/entity/MediaRequest';

interface TitleCardProps {
  id: number;
  image?: string;
  summary: string;
  year: string;
  title: string;
  userScore: number;
  mediaType: MediaType;
  status?: MediaRequestStatus;
}

enum MediaRequestStatus {
  PENDING,
  APPROVED,
  DECLINED,
  AVAILABLE,
}

const TitleCard: React.FC<TitleCardProps> = ({
  id,
  image,
  summary,
  year,
  title,
  status,
  mediaType,
}) => {
  const [currentStatus, setCurrentStatus] = useState(status);
  const { hasPermission } = useUser();
  const [showDetail, setShowDetail] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const request = async () => {
    const response = await axios.post<MediaRequest>('/api/v1/request', {
      mediaId: id,
      mediaType,
    });

    if (response.data) {
      setCurrentStatus(response.data.status);
    }
  };

  // Just to get the year from the date
  if (year) {
    year = year.slice(0, 4);
  }

  return (
    <div
      style={{
        width: 180,
        height: 270,
      }}
    >
      <Modal
        visible={showRequestModal}
        backgroundClickable
        onCancel={() => setShowRequestModal(false)}
        onOk={() => request()}
        title={`Request ${title}`}
        okText="Request"
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        }
      >
        {hasPermission(Permission.MANAGE_REQUESTS)
          ? 'Your request will be immediately approved. Do you wish to continue?'
          : undefined}
      </Modal>
      <div
        className="titleCard"
        style={{
          backgroundImage: `url(//image.tmdb.org/t/p/w600_and_h900_bestv2${image})`,
        }}
        onMouseEnter={() => setShowDetail(true)}
        onMouseLeave={() => setShowDetail(false)}
      >
        <div className="absolute top-0 h-full w-full bottom-0 left-0 right-0 overflow-hidden shadow-md">
          <div
            className={`absolute left-0 top-0 rounded-tl-md rounded-br-md z-50 ${
              mediaType === 'movie' ? 'bg-blue-500' : 'bg-purple-600'
            }`}
          >
            <div className="flex items-center text-center text-xs text-white h-4 px-2 py-1 font-normal">
              {mediaType === 'movie' ? 'MOVIE' : 'TV SHOW'}
            </div>
          </div>

          <div
            className="absolute right-0 top-0 z-50"
            style={{
              right: '-1px',
            }}
          >
            {currentStatus === MediaRequestStatus.AVAILABLE && (
              <Available className="rounded-tr-md" />
            )}
            {currentStatus === MediaRequestStatus.PENDING && (
              <Requested className="rounded-tr-md" />
            )}
            {currentStatus === MediaRequestStatus.APPROVED && (
              <Unavailable className="rounded-tr-md" />
            )}
          </div>

          <Transition
            show={!image || showDetail || showRequestModal}
            enter="transition ease-in-out duration-300 transform opacity-0"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition ease-in-out duration-300 transform opacity-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className="absolute w-full text-left top-0 right-0 left-0 bottom-0 rounded-lg overflow-hidden"
              style={{
                background:
                  'linear-gradient(180deg, rgba(45, 55, 72, 0.4) 0%, rgba(45, 55, 72, 0.9) 100%)',
              }}
            >
              <div className="absolute bottom-0 w-full left-0 right-0">
                <div className="px-2 text-white">
                  <div className="text-sm">{year}</div>

                  <h1 className="text-xl leading-tight">{title}</h1>
                  <div
                    className="text-xs whitespace-normal"
                    style={{
                      WebkitLineClamp: 3,
                      display: '-webkit-box',
                      overflow: 'hidden',
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {summary}
                  </div>
                </div>
                <div className="flex justify-between left-0 bottom-0 right-0 top-0 px-2 py-2">
                  <button className="w-full h-7 text-center text-white bg-indigo-500 rounded-sm mr-1 hover:bg-indigo-400 focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition ease-in-out duration-150">
                    <svg
                      className="w-4 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="w-full h-7 text-center text-white bg-indigo-500 rounded-sm ml-1 hover:bg-indigo-400 focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition ease-in-out duration-150"
                  >
                    <svg
                      className="w-4 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  );
};

export default withProperties(TitleCard, { Placeholder });
