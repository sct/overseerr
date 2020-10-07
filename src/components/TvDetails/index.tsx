import React, { useState, useContext } from 'react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import Button from '../Common/Button';
import type { TvResult } from '../../../server/models/Search';
import Link from 'next/link';
import Slider from '../Slider';
import TitleCard from '../TitleCard';
import PersonCard from '../PersonCard';
import { LanguageContext } from '../../context/LanguageContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import { useUser, Permission } from '../../hooks/useUser';
import { TvDetails as TvDetailsType } from '../../../server/models/Tv';
import { MediaStatus } from '../../../server/constants/media';
import RequestModal from '../RequestModal';

const messages = defineMessages({
  userrating: 'User Rating',
  status: 'Status',
  originallanguage: 'Original Language',
  overview: 'Overview',
  cast: 'Cast',
  recommendations: 'Recommendations',
  similar: 'Similar Series',
  cancelrequest: 'Cancel Request',
  available: 'Available',
  unavailable: 'Unavailable',
  request: 'Request',
  pending: 'Pending',
  overviewunavailable: 'Overview unavailable',
});

interface TvDetailsProps {
  tv?: TvDetailsType;
}

interface SearchResult {
  page: number;
  totalResults: number;
  totalPages: number;
  results: TvResult[];
}

enum MediaRequestStatus {
  PENDING = 1,
  APPROVED,
  DECLINED,
  AVAILABLE,
}

const TvDetails: React.FC<TvDetailsProps> = ({ tv }) => {
  const { hasPermission } = useUser();
  const router = useRouter();
  const intl = useIntl();
  const { locale } = useContext(LanguageContext);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const { data, error, revalidate } = useSWR<TvDetailsType>(
    `/api/v1/tv/${router.query.tvId}?language=${locale}`,
    {
      initialData: tv,
    }
  );
  const { data: recommended, error: recommendedError } = useSWR<SearchResult>(
    `/api/v1/tv/${router.query.tvId}/recommendations?language=${locale}`
  );
  const { data: similar, error: similarError } = useSWR<SearchResult>(
    `/api/v1/tv/${router.query.tvId}/similar?language=${locale}`
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <div>Broken?</div>;
  }

  return (
    <div
      className="bg-cover bg-center -mx-4 -mt-2 px-4 sm:px-8 pt-4 "
      style={{
        height: 493,
        backgroundImage: `linear-gradient(180deg, rgba(45, 55, 72, 0.47) 0%, #1A202E 100%), url(//image.tmdb.org/t/p/w1920_and_h800_multi_faces/${data.backdropPath})`,
      }}
    >
      <RequestModal
        tmdbId={data.id}
        show={showRequestModal}
        type="tv"
        requestId={data.mediaInfo?.requests?.[0]?.id}
        onComplete={() => revalidate()}
        onCancel={() => setShowRequestModal(false)}
      />
      <div className="flex flex-col items-center md:flex-row md:items-end pt-4">
        <div className="mr-4 flex-shrink-0">
          <img
            src={`//image.tmdb.org/t/p/w600_and_h900_bestv2${data.posterPath}`}
            alt=""
            className="rounded md:rounded-lg shadow md:shadow-2xl w-32 md:w-52"
          />
        </div>
        <div className="text-white flex flex-col mr-4 mt-4 md:mt-0 text-center md:text-left">
          <span className="md:text-2xl md:leading-none">
            {data.firstAirDate.slice(0, 4)}
          </span>
          <h1 className="text-2xl md:text-4xl">{data.name}</h1>
          <span className="text-xs md:text-base mt-1 md:mt-0">
            {data.genres.map((g) => g.name).join(', ')}
          </span>
        </div>
        <div className="flex-1 flex justify-end mt-4 md:mt-0">
          {(!data.mediaInfo ||
            data.mediaInfo.status === MediaStatus.UNKNOWN) && (
            <Button
              buttonType="primary"
              onClick={() => setShowRequestModal(true)}
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
              <FormattedMessage {...messages.request} />
            </Button>
          )}
          {data.mediaInfo?.status === MediaStatus.PENDING && (
            <Button buttonType="warning">
              <svg
                className="w-4 mr-2"
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
              <FormattedMessage {...messages.pending} />
            </Button>
          )}
          {data.mediaInfo?.status === MediaStatus.PROCESSING && (
            <Button buttonType="danger">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <FormattedMessage {...messages.unavailable} />
            </Button>
          )}
          {data.mediaInfo?.status === MediaStatus.AVAILABLE && (
            <Button buttonType="success">
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
              <FormattedMessage {...messages.available} />
            </Button>
          )}
          <Button buttonType="danger" className="ml-2">
            <svg
              className="w-5"
              style={{ height: 20 }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </Button>
          {hasPermission(Permission.MANAGE_REQUESTS) && (
            <Button buttonType="default" className="ml-2">
              <svg
                className="w-5"
                style={{ height: 20 }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </Button>
          )}
        </div>
      </div>
      <div className="flex pt-8 text-white flex-col md:flex-row pb-4">
        <div className="flex-1 md:mr-8">
          {/* {data.mediaInfo?.status === MediaStatus.PENDING &&
            hasPermission(Permission.MANAGE_REQUESTS) && (
              <PendingRequest
                request={data.request}
                onUpdate={() => revalidate()}
              />
            )} */}
          <h2 className="text-xl md:text-2xl">
            <FormattedMessage {...messages.overview} />
          </h2>
          <p className="pt-2 text-sm md:text-base">
            {data.overview
              ? data.overview
              : intl.formatMessage(messages.overviewunavailable)}
          </p>
        </div>
        <div className="w-full md:w-80 mt-8 md:mt-0">
          <div className="bg-cool-gray-900 rounded-lg shadow border border-cool-gray-800">
            {data.voteCount > 0 && (
              <div className="flex px-4 py-2 border-b border-cool-gray-800 last:border-b-0">
                <span className="text-sm">
                  <FormattedMessage {...messages.userrating} />
                </span>
                <span className="flex-1 text-right text-cool-gray-400 text-sm">
                  {data.voteAverage}/10
                </span>
              </div>
            )}
            <div className="flex px-4 py-2 border-b border-cool-gray-800 last:border-b-0">
              <span className="text-sm">
                <FormattedMessage {...messages.status} />
              </span>
              <span className="flex-1 text-right text-cool-gray-400 text-sm">
                {data.status}
              </span>
            </div>
            <div className="flex px-4 py-2 border-b border-cool-gray-800 last:border-b-0">
              <span className="text-sm">
                <FormattedMessage {...messages.originallanguage} />
              </span>
              <span className="flex-1 text-right text-cool-gray-400 text-sm">
                {data.originalLanguage}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="md:flex md:items-center md:justify-between mb-4 mt-6">
        <div className="flex-1 min-w-0">
          <Link href="/tv/[tvId]/cast" as={`/tv/${data.id}/cast`}>
            <a className="inline-flex text-xl leading-7 text-cool-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate items-center">
              <span>
                <FormattedMessage {...messages.cast} />
              </span>
              <svg
                className="w-6 h-6 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </a>
          </Link>
        </div>
      </div>
      <Slider
        sliderKey="cast"
        isLoading={!data && !error}
        isEmpty={false}
        items={data?.credits.cast.slice(0, 20).map((person) => (
          <PersonCard
            key={`cast-item-${person.id}`}
            name={person.name}
            subName={person.character}
            profilePath={person.profilePath}
          />
        ))}
      />
      <div className="md:flex md:items-center md:justify-between mb-4 mt-6">
        <div className="flex-1 min-w-0">
          <Link
            href="/tv/[tvId]/recommendations"
            as={`/tv/${data.id}/recommendations`}
          >
            <a className="inline-flex text-xl leading-7 text-cool-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate items-center">
              <span>
                <FormattedMessage {...messages.recommendations} />
              </span>
              <svg
                className="w-6 h-6 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </a>
          </Link>
        </div>
      </div>
      <Slider
        sliderKey="recommendations"
        isLoading={!recommended && !recommendedError}
        isEmpty={false}
        items={recommended?.results.map((title) => (
          <TitleCard
            key={`recommended-${title.id}`}
            id={title.id}
            image={title.posterPath}
            status={title.mediaInfo?.status}
            summary={title.overview}
            title={title.name}
            userScore={title.voteAverage}
            year={title.firstAirDate}
            mediaType={title.mediaType}
          />
        ))}
      />
      <div className="md:flex md:items-center md:justify-between mb-4 mt-6">
        <div className="flex-1 min-w-0">
          <Link href="/tv/[tvId]/similar" as={`/tv/${data.id}/similar`}>
            <a className="inline-flex text-xl leading-7 text-cool-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate items-center">
              <span>
                <FormattedMessage {...messages.similar} />
              </span>
              <svg
                className="w-6 h-6 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </a>
          </Link>
        </div>
      </div>
      <Slider
        sliderKey="similar"
        isLoading={!similar && !similarError}
        isEmpty={false}
        items={similar?.results.map((title) => (
          <TitleCard
            key={`recommended-${title.id}`}
            id={title.id}
            image={title.posterPath}
            status={title.mediaInfo?.status}
            summary={title.overview}
            title={title.name}
            userScore={title.voteAverage}
            year={title.firstAirDate}
            mediaType={title.mediaType}
          />
        ))}
      />
      <div className="pb-8" />
    </div>
  );
};

export default TvDetails;
