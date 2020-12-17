import React, { useState, useCallback } from 'react';
import type { MediaType } from '../../../server/models/Search';
import Available from '../../assets/available.svg';
import Requested from '../../assets/requested.svg';
import Unavailable from '../../assets/unavailable.svg';
import { withProperties } from '../../utils/typeHelpers';
import Transition from '../Transition';
import Placeholder from './Placeholder';
import Link from 'next/link';
import { MediaStatus } from '../../../server/constants/media';
import RequestModal from '../RequestModal';
import { defineMessages, useIntl } from 'react-intl';
import { useIsTouch } from '../../hooks/useIsTouch';

const messages = defineMessages({
  movie: 'Movie',
  tvshow: 'Series',
});

interface TitleCardProps {
  id: number;
  image?: string;
  summary?: string;
  year?: string;
  title: string;
  userScore: number;
  mediaType: MediaType;
  status?: MediaStatus;
  canExpand?: boolean;
}

const TitleCard: React.FC<TitleCardProps> = ({
  id,
  image,
  summary,
  year,
  title,
  status,
  mediaType,
  canExpand = false,
}) => {
  const isTouch = useIsTouch();
  const intl = useIntl();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [showDetail, setShowDetail] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Just to get the year from the date
  if (year) {
    year = year.slice(0, 4);
  }

  const requestComplete = useCallback((newStatus: MediaStatus) => {
    setCurrentStatus(newStatus);
    setShowRequestModal(false);
  }, []);

  const requestUpdating = useCallback(
    (status: boolean) => setIsUpdating(status),
    []
  );

  const closeModal = useCallback(() => setShowRequestModal(false), []);

  return (
    <div className={canExpand ? 'w-full' : 'w-36 sm:w-36 md:w-44'}>
      <RequestModal
        tmdbId={id}
        show={showRequestModal}
        type={mediaType === 'movie' ? 'movie' : 'tv'}
        onComplete={requestComplete}
        onUpdating={requestUpdating}
        onCancel={closeModal}
      />
      <div
        className="titleCard outline-none cursor-default"
        style={{
          backgroundImage: `url(//image.tmdb.org/t/p/w300_and_h450_face${image})`,
        }}
        onMouseEnter={() => {
          if (!isTouch) {
            setShowDetail(true);
          }
        }}
        onMouseLeave={() => setShowDetail(false)}
        onClick={() => setShowDetail(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setShowDetail(true);
          }
        }}
        role="link"
        tabIndex={0}
      >
        <div className="absolute top-0 h-full w-full bottom-0 left-0 right-0 overflow-hidden shadow-xl">
          <div
            className={`absolute left-0 top-0 rounded-tl-md rounded-br-md z-40 ${
              mediaType === 'movie' ? 'bg-blue-500' : 'bg-purple-600'
            }`}
          >
            <div className="flex items-center text-center text-xs text-white h-4 px-2 py-1 font-normal uppercase">
              {mediaType === 'movie'
                ? intl.formatMessage(messages.movie)
                : intl.formatMessage(messages.tvshow)}
            </div>
          </div>

          <div
            className="absolute right-0 top-0 z-40"
            style={{
              right: '-1px',
            }}
          >
            {(currentStatus === MediaStatus.AVAILABLE ||
              currentStatus === MediaStatus.PARTIALLY_AVAILABLE) && (
              <Available className="rounded-tr-md" />
            )}
            {currentStatus === MediaStatus.PENDING && (
              <Requested className="rounded-tr-md" />
            )}
            {currentStatus === MediaStatus.PROCESSING && (
              <Unavailable className="rounded-tr-md" />
            )}
          </div>
          <Transition
            show={isUpdating}
            enter="transition ease-in-out duration-300 transform opacity-0"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition ease-in-out duration-300 transform opacity-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="absolute top-0 left-0 right-0 bottom-0 bg-gray-800 bg-opacity-75 z-40 text-white flex items-center justify-center rounded-lg">
              <svg
                className="w-10 h-10 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
          </Transition>

          <Transition
            show={!image || showDetail || showRequestModal}
            enter="transition transform opacity-0"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition transform opacity-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Link href={mediaType === 'movie' ? `/movie/${id}` : `/tv/${id}`}>
              <a
                className="absolute w-full text-left top-0 right-0 left-0 bottom-0 rounded-lg overflow-hidden cursor-pointer"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(45, 55, 72, 0.4) 0%, rgba(45, 55, 72, 0.9) 100%)',
                }}
              >
                <div className="absolute bottom-0 w-full left-0 right-0">
                  <div className="px-2 text-white">
                    {year && <div className="text-sm">{year}</div>}

                    <h1 className="text-xl leading-tight whitespace-normal">
                      {title}
                    </h1>
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
                    <Link
                      href={
                        mediaType === 'movie' ? `/movie/${id}` : `/tv/${id}`
                      }
                    >
                      <a className="cursor-pointer flex w-full h-7 text-center text-white bg-indigo-500 rounded-sm hover:bg-indigo-400 focus:border-indigo-700 focus:ring-indigo active:bg-indigo-700 transition ease-in-out duration-150">
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
                      </a>
                    </Link>
                    {(!currentStatus ||
                      currentStatus === MediaStatus.UNKNOWN) && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setShowRequestModal(true);
                        }}
                        className="w-full h-7 text-center text-white bg-indigo-500 rounded-sm ml-2 hover:bg-indigo-400 focus:border-indigo-700 focus:ring-indigo active:bg-indigo-700 transition ease-in-out duration-150"
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
                    )}
                    {currentStatus === MediaStatus.PENDING && (
                      <button
                        className="w-full h-7 text-center text-yellow-500 border border-yellow-500 rounded-sm ml-2 cursor-default"
                        disabled
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
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                          />
                        </svg>
                      </button>
                    )}
                    {currentStatus === MediaStatus.PROCESSING && (
                      <button
                        className="w-full h-7 text-center text-red-500 border border-red-500 rounded-sm ml-2 cursor-default"
                        disabled
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </button>
                    )}
                    {(currentStatus === MediaStatus.AVAILABLE ||
                      currentStatus === MediaStatus.PARTIALLY_AVAILABLE) && (
                      <button
                        className="w-full h-7 text-center text-green-400 border border-green-400 rounded-sm ml-2 cursor-default"
                        disabled
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </a>
            </Link>
          </Transition>
        </div>
      </div>
    </div>
  );
};

export default withProperties(TitleCard, { Placeholder });
