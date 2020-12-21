import React, { useState, useContext, useMemo } from 'react';
import {
  FormattedMessage,
  defineMessages,
  FormattedNumber,
  FormattedDate,
  useIntl,
} from 'react-intl';
import type { MovieDetails as MovieDetailsType } from '../../../server/models/Movie';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import Button from '../Common/Button';
import type { MovieResult } from '../../../server/models/Search';
import Link from 'next/link';
import Slider from '../Slider';
import TitleCard from '../TitleCard';
import PersonCard from '../PersonCard';
import { LanguageContext } from '../../context/LanguageContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import { useUser, Permission } from '../../hooks/useUser';
import {
  MediaStatus,
  MediaRequestStatus,
} from '../../../server/constants/media';
import RequestModal from '../RequestModal';
import Badge from '../Common/Badge';
import ButtonWithDropdown from '../Common/ButtonWithDropdown';
import axios from 'axios';
import SlideOver from '../Common/SlideOver';
import RequestBlock from '../RequestBlock';
import TmdbLogo from '../../assets/tmdb_logo.svg';
import RTFresh from '../../assets/rt_fresh.svg';
import RTRotten from '../../assets/rt_rotten.svg';
import RTAudFresh from '../../assets/rt_aud_fresh.svg';
import RTAudRotten from '../../assets/rt_aud_rotten.svg';
import type { RTRating } from '../../../server/api/rottentomatoes';
import Error from '../../pages/_error';
import Head from 'next/head';
import globalMessages from '../../i18n/globalMessages';
import ExternalLinkBlock from '../ExternalLinkBlock';
import { sortCrewPriority } from '../../utils/creditHelpers';

const messages = defineMessages({
  releasedate: 'Release Date',
  userrating: 'User Rating',
  status: 'Status',
  revenue: 'Revenue',
  budget: 'Budget',
  originallanguage: 'Original Language',
  overview: 'Overview',
  runtime: '{minutes} minutes',
  cast: 'Cast',
  recommendations: 'Recommendations',
  similar: 'Similar Titles',
  cancelrequest: 'Cancel Request',
  available: 'Available',
  unavailable: 'Unavailable',
  request: 'Request',
  viewrequest: 'View Request',
  pending: 'Pending',
  overviewunavailable: 'Overview unavailable',
  manageModalTitle: 'Manage Movie',
  manageModalRequests: 'Requests',
  manageModalNoRequests: 'No Requests',
  manageModalClearMedia: 'Clear All Media Data',
  manageModalClearMediaWarning:
    'This will remove all media data including all requests for this item. This action is irreversible. If this item exists in your Plex library, the media information will be recreated next sync.',
  approve: 'Approve',
  decline: 'Decline',
  studio: 'Studio',
});

interface MovieDetailsProps {
  movie?: MovieDetailsType;
}

interface SearchResult {
  page: number;
  totalResults: number;
  totalPages: number;
  results: MovieResult[];
}

const MovieDetails: React.FC<MovieDetailsProps> = ({ movie }) => {
  const { hasPermission } = useUser();
  const router = useRouter();
  const intl = useIntl();
  const { locale } = useContext(LanguageContext);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const { data, error, revalidate } = useSWR<MovieDetailsType>(
    `/api/v1/movie/${router.query.movieId}?language=${locale}`,
    {
      initialData: movie,
    }
  );
  const { data: recommended, error: recommendedError } = useSWR<SearchResult>(
    `/api/v1/movie/${router.query.movieId}/recommendations?language=${locale}`
  );
  const { data: similar, error: similarError } = useSWR<SearchResult>(
    `/api/v1/movie/${router.query.movieId}/similar?language=${locale}`
  );
  const { data: ratingData } = useSWR<RTRating>(
    `/api/v1/movie/${router.query.movieId}/ratings`
  );

  const sortedCrew = useMemo(() => sortCrewPriority(data?.credits.crew ?? []), [
    data,
  ]);

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <Error statusCode={404} />;
  }

  const activeRequest = data?.mediaInfo?.requests?.find(
    (request) => request.status === MediaRequestStatus.PENDING
  );

  const modifyRequest = async (type: 'approve' | 'decline') => {
    const response = await axios.get(
      `/api/v1/request/${activeRequest?.id}/${type}`
    );

    if (response) {
      revalidate();
    }
  };

  const deleteMedia = async () => {
    if (data?.mediaInfo?.id) {
      await axios.delete(`/api/v1/media/${data?.mediaInfo?.id}`);
      revalidate();
    }
  };

  return (
    <div
      className="px-4 pt-4 -mx-4 -mt-2 bg-center bg-cover sm:px-8 "
      style={{
        height: 493,
        backgroundImage: `linear-gradient(180deg, rgba(17, 24, 39, 0.47) 0%, rgba(17, 24, 39, 1) 100%), url(//image.tmdb.org/t/p/w1920_and_h800_multi_faces/${data.backdropPath})`,
      }}
    >
      <Head>
        <title>{data.title} - Overseerr</title>
      </Head>
      <RequestModal
        tmdbId={data.id}
        show={showRequestModal}
        type="movie"
        onComplete={() => {
          revalidate();
          setShowRequestModal(false);
        }}
        onCancel={() => setShowRequestModal(false)}
      />
      <SlideOver
        show={showManager}
        title={intl.formatMessage(messages.manageModalTitle)}
        onClose={() => setShowManager(false)}
        subText={data.title}
      >
        <h3 className="mb-2 text-xl">
          {intl.formatMessage(messages.manageModalRequests)}
        </h3>
        <div className="overflow-hidden bg-gray-600 rounded-md shadow">
          <ul>
            {data.mediaInfo?.requests?.map((request) => (
              <li
                key={`manage-request-${request.id}`}
                className="border-b border-gray-700 last:border-b-0"
              >
                <RequestBlock request={request} onUpdate={() => revalidate()} />
              </li>
            ))}
            {(data.mediaInfo?.requests ?? []).length === 0 && (
              <li className="py-4 text-center text-gray-400">
                {intl.formatMessage(messages.manageModalNoRequests)}
              </li>
            )}
          </ul>
        </div>
        {data?.mediaInfo && (
          <div className="mt-8">
            <Button
              buttonType="danger"
              className="w-full text-center"
              onClick={() => deleteMedia()}
            >
              {intl.formatMessage(messages.manageModalClearMedia)}
            </Button>
            <div className="mt-2 text-sm text-gray-400">
              {intl.formatMessage(messages.manageModalClearMediaWarning)}
            </div>
          </div>
        )}
      </SlideOver>
      <div className="flex flex-col items-center pt-4 md:flex-row md:items-end">
        <div className="flex-shrink-0 md:mr-4">
          <img
            src={`//image.tmdb.org/t/p/w600_and_h900_bestv2${data.posterPath}`}
            alt=""
            className="w-32 rounded shadow md:rounded-lg md:shadow-2xl md:w-52"
          />
        </div>
        <div className="flex flex-col mt-4 text-center text-white md:mr-4 md:mt-0 md:text-left">
          <div className="mb-2">
            {data.mediaInfo?.status === MediaStatus.AVAILABLE && (
              <Badge badgeType="success">
                {intl.formatMessage(globalMessages.available)}
              </Badge>
            )}
            {data.mediaInfo?.status === MediaStatus.PROCESSING && (
              <Badge badgeType="danger">
                {intl.formatMessage(globalMessages.unavailable)}
              </Badge>
            )}
            {data.mediaInfo?.status === MediaStatus.PENDING && (
              <Badge badgeType="warning">
                {intl.formatMessage(globalMessages.pending)}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-4xl">
            {data.title}{' '}
            <span className="text-2xl">({data.releaseDate.slice(0, 4)})</span>
          </h1>
          <span className="mt-1 text-xs md:text-base md:mt-0">
            {(data.runtime ?? 0) > 0 && (
              <>
                <FormattedMessage
                  {...messages.runtime}
                  values={{ minutes: data.runtime }}
                />{' '}
                |{' '}
              </>
            )}
            {data.genres.map((g) => g.name).join(', ')}
          </span>
        </div>
        <div className="flex justify-end flex-1 mt-4 md:mt-0">
          {(!data.mediaInfo ||
            data.mediaInfo?.status === MediaStatus.UNKNOWN) && (
            <Button
              buttonType="primary"
              onClick={() => setShowRequestModal(true)}
            >
              {activeRequest ? (
                <svg
                  className="w-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
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
              )}
              <FormattedMessage {...messages.request} />
            </Button>
          )}
          {activeRequest && (
            <ButtonWithDropdown
              dropdownIcon={
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              text={
                <>
                  <svg
                    className="w-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <FormattedMessage {...messages.viewrequest} />
                </>
              }
              onClick={() => setShowRequestModal(true)}
            >
              {hasPermission(Permission.MANAGE_REQUESTS) && (
                <>
                  <ButtonWithDropdown.Item
                    onClick={() => modifyRequest('approve')}
                  >
                    <svg
                      className="w-4 mr-1"
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
                    {intl.formatMessage(messages.approve)}
                  </ButtonWithDropdown.Item>
                  <ButtonWithDropdown.Item
                    onClick={() => modifyRequest('decline')}
                  >
                    <svg
                      className="w-4 mr-1"
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
                    {intl.formatMessage(messages.decline)}
                  </ButtonWithDropdown.Item>
                </>
              )}
            </ButtonWithDropdown>
          )}
          {hasPermission(Permission.MANAGE_REQUESTS) && (
            <Button
              buttonType="default"
              className="ml-2 first:ml-0"
              onClick={() => setShowManager(true)}
            >
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
      <div className="flex flex-col pt-8 pb-4 text-white md:flex-row">
        <div className="flex-1 md:mr-8">
          <h2 className="text-xl md:text-2xl">
            <FormattedMessage {...messages.overview} />
          </h2>
          <p className="pt-2 text-sm md:text-base">
            {data.overview
              ? data.overview
              : intl.formatMessage(messages.overviewunavailable)}
          </p>
          <ul className="grid grid-cols-2 gap-6 mt-6 sm:grid-cols-3">
            {sortedCrew.slice(0, 6).map((person) => (
              <li
                className="flex flex-col col-span-1"
                key={`crew-${person.job}-${person.id}`}
              >
                <span className="font-bold">{person.job}</span>
                <Link href={`/person/${person.id}`}>
                  <a className="text-gray-400 transition duration-300 hover:text-underline hover:text-gray-100">
                    {person.name}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full mt-8 md:w-80 md:mt-0">
          <div className="bg-gray-900 border border-gray-800 rounded-lg shadow">
            {(data.voteCount > 0 || ratingData) && (
              <div className="flex items-center justify-center px-4 py-2 border-b border-gray-800 last:border-b-0">
                {ratingData?.criticsRating &&
                  (ratingData?.criticsScore ?? 0) > 0 && (
                    <>
                      <span className="text-sm">
                        {ratingData.criticsRating === 'Rotten' ? (
                          <RTRotten className="w-6 mr-1" />
                        ) : (
                          <RTFresh className="w-6 mr-1" />
                        )}
                      </span>
                      <span className="mr-4 text-sm text-gray-400 last:mr-0">
                        {ratingData.criticsScore}%
                      </span>
                    </>
                  )}
                {ratingData?.audienceRating &&
                  (ratingData?.audienceScore ?? 0) > 0 && (
                    <>
                      <span className="text-sm">
                        {ratingData.audienceRating === 'Spilled' ? (
                          <RTAudRotten className="w-6 mr-1" />
                        ) : (
                          <RTAudFresh className="w-6 mr-1" />
                        )}
                      </span>
                      <span className="mr-4 text-sm text-gray-400 last:mr-0">
                        {ratingData.audienceScore}%
                      </span>
                    </>
                  )}
                {data.voteCount > 0 && (
                  <>
                    <span className="text-sm">
                      <TmdbLogo className="w-6 mr-2" />
                    </span>
                    <span className="text-sm text-gray-400">
                      {data.voteAverage}/10
                    </span>
                  </>
                )}
              </div>
            )}
            <div className="flex px-4 py-2 border-b border-gray-800 last:border-b-0">
              <span className="text-sm">
                <FormattedMessage {...messages.releasedate} />
              </span>
              <span className="flex-1 text-sm text-right text-gray-400">
                <FormattedDate
                  value={new Date(data.releaseDate)}
                  year="numeric"
                  month="long"
                  day="numeric"
                />
              </span>
            </div>
            <div className="flex px-4 py-2 border-b border-gray-800 last:border-b-0">
              <span className="text-sm">
                <FormattedMessage {...messages.status} />
              </span>
              <span className="flex-1 text-sm text-right text-gray-400">
                {data.status}
              </span>
            </div>
            {data.revenue > 0 && (
              <div className="flex px-4 py-2 border-b border-gray-800 last:border-b-0">
                <span className="text-sm">
                  <FormattedMessage {...messages.revenue} />
                </span>
                <span className="flex-1 text-sm text-right text-gray-400">
                  <FormattedNumber
                    currency="USD"
                    style="currency"
                    value={data.revenue}
                  />
                </span>
              </div>
            )}
            {data.budget > 0 && (
              <div className="flex px-4 py-2 border-b border-gray-800 last:border-b-0">
                <span className="text-sm">
                  <FormattedMessage {...messages.budget} />
                </span>
                <span className="flex-1 text-sm text-right text-gray-400">
                  <FormattedNumber
                    currency="USD"
                    style="currency"
                    value={data.budget}
                  />
                </span>
              </div>
            )}
            {data.spokenLanguages.some(
              (lng) => lng.iso_639_1 === data.originalLanguage
            ) && (
              <div className="flex px-4 py-2 border-b border-gray-800 last:border-b-0">
                <span className="text-sm">
                  <FormattedMessage {...messages.originallanguage} />
                </span>
                <span className="flex-1 text-sm text-right text-gray-400">
                  {
                    data.spokenLanguages.find(
                      (lng) => lng.iso_639_1 === data.originalLanguage
                    )?.name
                  }
                </span>
              </div>
            )}
            {data.productionCompanies[0] && (
              <div className="flex px-4 py-2 border-b border-gray-800 last:border-b-0">
                <span className="text-sm">
                  <FormattedMessage {...messages.studio} />
                </span>
                <span className="flex-1 text-sm text-right text-gray-400">
                  {data.productionCompanies[0]?.name}
                </span>
              </div>
            )}
          </div>
          <div className="mt-4">
            <ExternalLinkBlock
              mediaType="movie"
              tmdbId={data.id}
              imdbId={data.externalIds.imdbId}
              rtUrl={ratingData?.url}
            />
          </div>
        </div>
      </div>
      <div className="mt-6 mb-4 md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <Link href="/movie/[movieId]/cast" as={`/movie/${data.id}/cast`}>
            <a className="inline-flex items-center text-xl leading-7 text-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate">
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
        isLoading={false}
        isEmpty={false}
        items={data?.credits.cast.slice(0, 20).map((person) => (
          <PersonCard
            key={`cast-item-${person.id}`}
            personId={person.id}
            name={person.name}
            subName={person.character}
            profilePath={person.profilePath}
          />
        ))}
      />
      {(recommended?.results ?? []).length > 0 && (
        <>
          <div className="mt-6 mb-4 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <Link
                href="/movie/[movieId]/recommendations"
                as={`/movie/${data.id}/recommendations`}
              >
                <a className="inline-flex items-center text-xl leading-7 text-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate">
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
                title={title.title}
                userScore={title.voteAverage}
                year={title.releaseDate}
                mediaType={title.mediaType}
              />
            ))}
          />
        </>
      )}
      {(similar?.results ?? []).length > 0 && (
        <>
          <div className="mt-6 mb-4 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <Link
                href="/movie/[movieId]/similar"
                as={`/movie/${data.id}/similar`}
              >
                <a className="inline-flex items-center text-xl leading-7 text-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate">
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
                title={title.title}
                userScore={title.voteAverage}
                year={title.releaseDate}
                mediaType={title.mediaType}
              />
            ))}
          />
        </>
      )}
      <div className="pb-8" />
    </div>
  );
};

export default MovieDetails;
