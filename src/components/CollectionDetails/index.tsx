import axios from 'axios';
import { uniq } from 'lodash';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useContext, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import { MediaStatus } from '../../../server/constants/media';
import type { MediaRequest } from '../../../server/entity/MediaRequest';
import type { Collection } from '../../../server/models/Collection';
import { LanguageContext } from '../../context/LanguageContext';
import useSettings from '../../hooks/useSettings';
import { Permission, useUser } from '../../hooks/useUser';
import globalMessages from '../../i18n/globalMessages';
import Error from '../../pages/_error';
import ButtonWithDropdown from '../Common/ButtonWithDropdown';
import CachedImage from '../Common/CachedImage';
import LoadingSpinner from '../Common/LoadingSpinner';
import Modal from '../Common/Modal';
import PageTitle from '../Common/PageTitle';
import Slider from '../Slider';
import StatusBadge from '../StatusBadge';
import TitleCard from '../TitleCard';
import Transition from '../Transition';

const messages = defineMessages({
  overviewunavailable: 'Overview unavailable.',
  overview: 'Overview',
  movies: 'Movies',
  numberofmovies: '{count} Movies',
  requesting: 'Requesting…',
  request: 'Request',
  requestcollection: 'Request Collection',
  requestswillbecreated:
    'The following titles will have requests created for them:',
  request4k: 'Request 4K',
  requestcollection4k: 'Request Collection in 4K',
  requestswillbecreated4k:
    'The following titles will have 4K requests created for them:',
  requestSuccess: '<strong>{title}</strong> requested successfully!',
});

interface CollectionDetailsProps {
  collection?: Collection;
}

const CollectionDetails: React.FC<CollectionDetailsProps> = ({
  collection,
}) => {
  const intl = useIntl();
  const router = useRouter();
  const settings = useSettings();
  const { addToast } = useToasts();
  const { locale } = useContext(LanguageContext);
  const { hasPermission } = useUser();
  const [requestModal, setRequestModal] = useState(false);
  const [isRequesting, setRequesting] = useState(false);
  const [is4k, setIs4k] = useState(false);

  const { data, error, revalidate } = useSWR<Collection>(
    `/api/v1/collection/${router.query.collectionId}?language=${locale}`,
    {
      initialData: collection,
      revalidateOnMount: true,
    }
  );

  const { data: genres } = useSWR<{ id: number; name: string }[]>(
    `/api/v1/genres/movie?language=${locale}`
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <Error statusCode={404} />;
  }

  let collectionStatus = MediaStatus.UNKNOWN;
  let collectionStatus4k = MediaStatus.UNKNOWN;

  if (
    data.parts.every(
      (part) =>
        part.mediaInfo && part.mediaInfo.status === MediaStatus.AVAILABLE
    )
  ) {
    collectionStatus = MediaStatus.AVAILABLE;
  } else if (
    data.parts.some(
      (part) =>
        part.mediaInfo && part.mediaInfo.status === MediaStatus.AVAILABLE
    )
  ) {
    collectionStatus = MediaStatus.PARTIALLY_AVAILABLE;
  }

  if (
    data.parts.every(
      (part) =>
        part.mediaInfo && part.mediaInfo.status4k === MediaStatus.AVAILABLE
    )
  ) {
    collectionStatus4k = MediaStatus.AVAILABLE;
  } else if (
    data.parts.some(
      (part) =>
        part.mediaInfo && part.mediaInfo.status4k === MediaStatus.AVAILABLE
    )
  ) {
    collectionStatus4k = MediaStatus.PARTIALLY_AVAILABLE;
  }

  const hasRequestable =
    data.parts.filter(
      (part) => !part.mediaInfo || part.mediaInfo.status === MediaStatus.UNKNOWN
    ).length > 0;

  const hasRequestable4k =
    data.parts.filter(
      (part) =>
        !part.mediaInfo || part.mediaInfo.status4k === MediaStatus.UNKNOWN
    ).length > 0;

  const requestableParts = data.parts.filter(
    (part) =>
      !part.mediaInfo ||
      part.mediaInfo[is4k ? 'status4k' : 'status'] === MediaStatus.UNKNOWN
  );

  const requestBundle = async () => {
    try {
      setRequesting(true);
      await Promise.all(
        requestableParts.map(async (part) => {
          await axios.post<MediaRequest>('/api/v1/request', {
            mediaId: part.id,
            mediaType: 'movie',
            is4k,
          });
        })
      );

      addToast(
        <span>
          {intl.formatMessage(messages.requestSuccess, {
            title: data?.name,
            strong: function strong(msg) {
              return <strong>{msg}</strong>;
            },
          })}
        </span>,
        { appearance: 'success', autoDismiss: true }
      );
    } catch (e) {
      addToast('Something went wrong requesting the collection.', {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      setRequesting(false);
      setRequestModal(false);
      revalidate();
    }
  };

  const collectionAttributes: React.ReactNode[] = [];

  collectionAttributes.push(
    intl.formatMessage(messages.numberofmovies, {
      count: data.parts.length,
    })
  );

  if (genres && data.parts.some((part) => part.genreIds.length)) {
    collectionAttributes.push(
      uniq(
        data.parts.reduce(
          (genresList: number[], curr) => genresList.concat(curr.genreIds),
          []
        )
      )
        .map((genreId) => (
          <Link
            href={`/discover/movies/genre/${genreId}`}
            key={`genre-${genreId}`}
          >
            <a className="hover:underline">
              {genres.find((g) => g.id === genreId)?.name}
            </a>
          </Link>
        ))
        .reduce((prev, curr) => (
          <>
            {intl.formatMessage(globalMessages.delimitedlist, {
              a: prev,
              b: curr,
            })}
          </>
        ))
    );
  }

  return (
    <div
      className="media-page"
      style={{
        height: 493,
      }}
    >
      {data.backdropPath && (
        <div className="media-page-bg-image">
          <CachedImage
            alt=""
            src={`https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/${data.backdropPath}`}
            layout="fill"
            objectFit="cover"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(180deg, rgba(17, 24, 39, 0.47) 0%, rgba(17, 24, 39, 1) 100%)',
            }}
          />
        </div>
      )}
      <PageTitle title={data.name} />
      <Transition
        enter="opacity-0 transition duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="opacity-100 transition duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        show={requestModal}
      >
        <Modal
          onOk={() => requestBundle()}
          okText={
            isRequesting
              ? intl.formatMessage(messages.requesting)
              : intl.formatMessage(is4k ? messages.request4k : messages.request)
          }
          okDisabled={isRequesting}
          okButtonType="primary"
          onCancel={() => setRequestModal(false)}
          title={intl.formatMessage(
            is4k ? messages.requestcollection4k : messages.requestcollection
          )}
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
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          }
        >
          <p>
            {intl.formatMessage(
              is4k
                ? messages.requestswillbecreated4k
                : messages.requestswillbecreated
            )}
          </p>
          <ul className="py-4 pl-8 list-disc">
            {data.parts
              .filter(
                (part) =>
                  !part.mediaInfo ||
                  part.mediaInfo[is4k ? 'status4k' : 'status'] ===
                    MediaStatus.UNKNOWN
              )
              .map((part) => (
                <li key={`request-part-${part.id}`}>{part.title}</li>
              ))}
          </ul>
        </Modal>
      </Transition>
      <div className="media-header">
        <div className="media-poster">
          <CachedImage
            src={
              data.posterPath
                ? `https://image.tmdb.org/t/p/w600_and_h900_bestv2${data.posterPath}`
                : '/images/overseerr_poster_not_found.png'
            }
            alt=""
            layout="responsive"
            width={600}
            height={900}
            priority
          />
        </div>
        <div className="media-title">
          <div className="media-status">
            <StatusBadge
              status={collectionStatus}
              inProgress={data.parts.some(
                (part) => (part.mediaInfo?.downloadStatus ?? []).length > 0
              )}
            />
            {settings.currentSettings.movie4kEnabled &&
              hasPermission(
                [Permission.REQUEST_4K, Permission.REQUEST_4K_MOVIE],
                {
                  type: 'or',
                }
              ) && (
                <StatusBadge
                  status={collectionStatus4k}
                  is4k
                  inProgress={data.parts.some(
                    (part) =>
                      (part.mediaInfo?.downloadStatus4k ?? []).length > 0
                  )}
                />
              )}
          </div>
          <h1>{data.name}</h1>
          <span className="media-attributes">
            {collectionAttributes.length > 0 &&
              collectionAttributes
                .map((t, k) => <span key={k}>{t}</span>)
                .reduce((prev, curr) => (
                  <>
                    {prev} | {curr}
                  </>
                ))}
          </span>
        </div>
        <div className="media-actions">
          {hasPermission(Permission.REQUEST) &&
            (hasRequestable ||
              (settings.currentSettings.movie4kEnabled &&
                hasPermission(
                  [Permission.REQUEST_4K, Permission.REQUEST_4K_MOVIE],
                  { type: 'or' }
                ) &&
                hasRequestable4k)) && (
              <ButtonWithDropdown
                buttonType="primary"
                onClick={() => {
                  setRequestModal(true);
                  setIs4k(!hasRequestable);
                }}
                text={
                  <>
                    <svg
                      className="w-4 mr-1"
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
                    <span>
                      {intl.formatMessage(
                        hasRequestable
                          ? messages.requestcollection
                          : messages.requestcollection4k
                      )}
                    </span>
                  </>
                }
              >
                {settings.currentSettings.movie4kEnabled &&
                  hasPermission(
                    [Permission.REQUEST_4K, Permission.REQUEST_4K_MOVIE],
                    { type: 'or' }
                  ) &&
                  hasRequestable &&
                  hasRequestable4k && (
                    <ButtonWithDropdown.Item
                      buttonType="primary"
                      onClick={() => {
                        setRequestModal(true);
                        setIs4k(true);
                      }}
                    >
                      <svg
                        className="w-4 mr-1"
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
                      <span>
                        {intl.formatMessage(messages.requestcollection4k)}
                      </span>
                    </ButtonWithDropdown.Item>
                  )}
              </ButtonWithDropdown>
            )}
        </div>
      </div>
      <div className="media-overview">
        <div className="flex-1">
          <h2>{intl.formatMessage(messages.overview)}</h2>
          <p>
            {data.overview
              ? data.overview
              : intl.formatMessage(messages.overviewunavailable)}
          </p>
        </div>
      </div>
      <div className="slider-header">
        <div className="slider-title">
          <span>{intl.formatMessage(messages.movies)}</span>
        </div>
      </div>
      <Slider
        sliderKey="collection-movies"
        isLoading={false}
        isEmpty={data.parts.length === 0}
        items={data.parts.map((title) => (
          <TitleCard
            key={`collection-movie-${title.id}`}
            id={title.id}
            image={title.posterPath}
            status={title.mediaInfo?.status}
            summary={title.overview}
            title={title.title}
            userScore={title.voteAverage}
            year={title.releaseDate}
            mediaType={title.mediaType}
          />
        ))}
      />
      <div className="pb-8" />
    </div>
  );
};

export default CollectionDetails;
