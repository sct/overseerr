import Spinner from '@app/assets/spinner.svg';
import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import StatusBadgeMini from '@app/components/Common/StatusBadgeMini';
import RequestModal from '@app/components/RequestModal';
import ErrorCard from '@app/components/TitleCard/ErrorCard';
import Placeholder from '@app/components/TitleCard/Placeholder';
import { useIsTouch } from '@app/hooks/useIsTouch';
import { Permission, useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import { withProperties } from '@app/utils/typeHelpers';
import { Transition } from '@headlessui/react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { MediaStatus } from '@server/constants/media';
import type { MediaType } from '@server/models/Search';
import Link from 'next/link';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

interface TitleCardProps {
  id: number;
  image?: string;
  summary?: string;
  year?: string;
  title: string;
  userScore?: number;
  mediaType: MediaType;
  status?: MediaStatus;
  canExpand?: boolean;
  inProgress?: boolean;
}

const TitleCard = ({
  id,
  image,
  summary,
  year,
  title,
  status,
  mediaType,
  inProgress = false,
  canExpand = false,
}: TitleCardProps) => {
  const isTouch = useIsTouch();
  const intl = useIntl();
  const { hasPermission } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [showDetail, setShowDetail] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Just to get the year from the date
  if (year) {
    year = year.slice(0, 4);
  }

  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  const requestComplete = useCallback((newStatus: MediaStatus) => {
    setCurrentStatus(newStatus);
    setShowRequestModal(false);
  }, []);

  const requestUpdating = useCallback(
    (status: boolean) => setIsUpdating(status),
    []
  );

  const closeModal = useCallback(() => setShowRequestModal(false), []);

  const showRequestButton = hasPermission(
    [
      Permission.REQUEST,
      mediaType === 'movie' || mediaType === 'collection'
        ? Permission.REQUEST_MOVIE
        : Permission.REQUEST_TV,
    ],
    { type: 'or' }
  );

  return (
    <div
      className={canExpand ? 'w-full' : 'w-36 sm:w-36 md:w-44'}
      data-testid="title-card"
    >
      <RequestModal
        tmdbId={id}
        show={showRequestModal}
        type={
          mediaType === 'movie'
            ? 'movie'
            : mediaType === 'collection'
            ? 'collection'
            : 'tv'
        }
        onComplete={requestComplete}
        onUpdating={requestUpdating}
        onCancel={closeModal}
      />
      <div
        className={`relative transform-gpu cursor-default overflow-hidden rounded-tv-lg bg-tv-surface bg-cover outline-none ring-1 transition-all duration-300 ease-out ${
          showDetail
            ? 'scale-105 shadow-tv-lg ring-tv-border-hover'
            : 'scale-100 shadow-tv ring-tv-border'
        }`}
        style={{
          paddingBottom: '150%',
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
        <div className="absolute inset-0 h-full w-full overflow-hidden">
          <CachedImage
            className="absolute inset-0 h-full w-full"
            alt=""
            src={
              image
                ? `https://image.tmdb.org/t/p/w300_and_h450_face${image}`
                : `/images/overseerr_poster_not_found_logo_top.png`
            }
            layout="fill"
            objectFit="cover"
          />
          <div className="absolute left-0 right-0 flex items-center justify-between p-2">
            <div
              className={`pointer-events-none z-40 rounded-full border bg-opacity-90 shadow-md backdrop-blur-glass-light ${
                mediaType === 'movie' || mediaType === 'collection'
                  ? 'border-tv-accent/50 bg-tv-accent'
                  : 'border-purple-500/50 bg-purple-500'
              }`}
              style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex h-4 items-center px-2 py-2 text-center text-xs font-medium uppercase tracking-wider text-white sm:h-5">
                {mediaType === 'movie'
                  ? intl.formatMessage(globalMessages.movie)
                  : mediaType === 'collection'
                  ? intl.formatMessage(globalMessages.collection)
                  : intl.formatMessage(globalMessages.tvshow)}
              </div>
            </div>
            {currentStatus && currentStatus !== MediaStatus.UNKNOWN && (
              <div className="pointer-events-none z-40 flex items-center">
                <StatusBadgeMini
                  status={currentStatus}
                  inProgress={inProgress}
                  shrink
                />
              </div>
            )}
          </div>
          <Transition
            as={Fragment}
            show={isUpdating}
            enter="transition-opacity ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className="absolute inset-0 z-40 flex items-center justify-center rounded-tv-lg bg-tv-card/95 text-white backdrop-blur-glass-strong"
              style={{
                backdropFilter: 'blur(60px)',
                WebkitBackdropFilter: 'blur(60px)',
              }}
            >
              <Spinner className="h-10 w-10" />
            </div>
          </Transition>

          <Transition
            as={Fragment}
            show={!image || showDetail || showRequestModal}
            enter="transition-opacity"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="absolute inset-0 overflow-hidden rounded-tv-lg">
              <Link
                href={
                  mediaType === 'movie'
                    ? `/movie/${id}`
                    : mediaType === 'collection'
                    ? `/collection/${id}`
                    : `/tv/${id}`
                }
              >
                <a
                  className="absolute inset-0 h-full w-full cursor-pointer overflow-hidden text-left backdrop-blur-glass"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.85) 100%)',
                    backdropFilter: 'blur(40px)',
                    WebkitBackdropFilter: 'blur(40px)',
                  }}
                >
                  <div className="flex h-full w-full items-end">
                    <div
                      className={`px-2 text-white ${
                        !showRequestButton ||
                        (currentStatus &&
                          currentStatus !== MediaStatus.UNKNOWN &&
                          currentStatus !== MediaStatus.DELETED)
                          ? 'pb-2'
                          : 'pb-11'
                      }`}
                    >
                      {year && (
                        <div className="text-sm font-medium">{year}</div>
                      )}

                      <h1
                        className="whitespace-normal text-xl font-bold leading-tight"
                        style={{
                          WebkitLineClamp: 3,
                          display: '-webkit-box',
                          overflow: 'hidden',
                          WebkitBoxOrient: 'vertical',
                          wordBreak: 'break-word',
                        }}
                        data-testid="title-card-title"
                      >
                        {title}
                      </h1>
                      <div
                        className="whitespace-normal text-xs"
                        style={{
                          WebkitLineClamp:
                            !showRequestButton ||
                            (currentStatus &&
                              currentStatus !== MediaStatus.UNKNOWN &&
                              currentStatus !== MediaStatus.DELETED)
                              ? 5
                              : 3,
                          display: '-webkit-box',
                          overflow: 'hidden',
                          WebkitBoxOrient: 'vertical',
                          wordBreak: 'break-word',
                        }}
                      >
                        {summary}
                      </div>
                    </div>
                  </div>
                </a>
              </Link>

              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 py-2">
                {showRequestButton &&
                  (!currentStatus ||
                    currentStatus === MediaStatus.UNKNOWN ||
                    currentStatus === MediaStatus.DELETED) && (
                    <Button
                      buttonType="primary"
                      buttonSize="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowRequestModal(true);
                      }}
                      className="h-7 w-full"
                    >
                      <ArrowDownTrayIcon />
                      <span>{intl.formatMessage(globalMessages.request)}</span>
                    </Button>
                  )}
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  );
};

export default withProperties(TitleCard, { Placeholder, ErrorCard });
