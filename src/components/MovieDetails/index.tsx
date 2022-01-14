import {
  ArrowCircleRightIcon,
  CloudIcon,
  CogIcon,
  ExclamationIcon,
  FilmIcon,
  PlayIcon,
  TicketIcon,
} from '@heroicons/react/outline';
import {
  ChevronDoubleDownIcon,
  ChevronDoubleUpIcon,
} from '@heroicons/react/solid';
import { hasFlag } from 'country-flag-icons';
import 'country-flag-icons/3x2/flags.css';
import { uniqBy } from 'lodash';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
import type { RTRating } from '../../../server/api/rottentomatoes';
import { IssueStatus } from '../../../server/constants/issue';
import { MediaStatus } from '../../../server/constants/media';
import type { MovieDetails as MovieDetailsType } from '../../../server/models/Movie';
import RTAudFresh from '../../assets/rt_aud_fresh.svg';
import RTAudRotten from '../../assets/rt_aud_rotten.svg';
import RTFresh from '../../assets/rt_fresh.svg';
import RTRotten from '../../assets/rt_rotten.svg';
import TmdbLogo from '../../assets/tmdb_logo.svg';
import useLocale from '../../hooks/useLocale';
import useSettings from '../../hooks/useSettings';
import { Permission, useUser } from '../../hooks/useUser';
import globalMessages from '../../i18n/globalMessages';
import Error from '../../pages/_error';
import { sortCrewPriority } from '../../utils/creditHelpers';
import Button from '../Common/Button';
import CachedImage from '../Common/CachedImage';
import LoadingSpinner from '../Common/LoadingSpinner';
import PageTitle from '../Common/PageTitle';
import PlayButton, { PlayButtonLink } from '../Common/PlayButton';
import ExternalLinkBlock from '../ExternalLinkBlock';
import IssueModal from '../IssueModal';
import ManageSlideOver from '../ManageSlideOver';
import MediaSlider from '../MediaSlider';
import PersonCard from '../PersonCard';
import RequestButton from '../RequestButton';
import Slider from '../Slider';
import StatusBadge from '../StatusBadge';

const messages = defineMessages({
  originaltitle: 'Original Title',
  releasedate:
    '{releaseCount, plural, one {Release Date} other {Release Dates}}',
  revenue: 'Revenue',
  budget: 'Budget',
  watchtrailer: 'Watch Trailer',
  originallanguage: 'Original Language',
  overview: 'Overview',
  runtime: '{minutes} minutes',
  cast: 'Cast',
  recommendations: 'Recommendations',
  similar: 'Similar Titles',
  overviewunavailable: 'Overview unavailable.',
  studio: '{studioCount, plural, one {Studio} other {Studios}}',
  viewfullcrew: 'View Full Crew',
  playonplex: 'Play on Plex',
  play4konplex: 'Play in 4K on Plex',
  markavailable: 'Mark as Available',
  mark4kavailable: 'Mark as Available in 4K',
  showmore: 'Show More',
  showless: 'Show Less',
  streamingproviders: 'Currently Streaming On',
  productioncountries:
    'Production {countryCount, plural, one {Country} other {Countries}}',
});

interface MovieDetailsProps {
  movie?: MovieDetailsType;
}

const MovieDetails: React.FC<MovieDetailsProps> = ({ movie }) => {
  const settings = useSettings();
  const { user, hasPermission } = useUser();
  const router = useRouter();
  const intl = useIntl();
  const { locale } = useLocale();
  const [showManager, setShowManager] = useState(false);
  const minStudios = 3;
  const [showMoreStudios, setShowMoreStudios] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);

  const { data, error, revalidate } = useSWR<MovieDetailsType>(
    `/api/v1/movie/${router.query.movieId}`,
    {
      initialData: movie,
    }
  );

  const { data: ratingData } = useSWR<RTRating>(
    `/api/v1/movie/${router.query.movieId}/ratings`
  );

  const sortedCrew = useMemo(
    () => sortCrewPriority(data?.credits.crew ?? []),
    [data]
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <Error statusCode={404} />;
  }

  const showAllStudios = data.productionCompanies.length <= minStudios + 1;
  const mediaLinks: PlayButtonLink[] = [];

  if (
    data.mediaInfo?.plexUrl &&
    hasPermission([Permission.REQUEST, Permission.REQUEST_MOVIE], {
      type: 'or',
    })
  ) {
    mediaLinks.push({
      text: intl.formatMessage(messages.playonplex),
      url: data.mediaInfo?.plexUrl,
      svg: <PlayIcon />,
    });
  }

  if (
    data.mediaInfo?.plexUrl4k &&
    hasPermission([Permission.REQUEST_4K, Permission.REQUEST_4K_MOVIE], {
      type: 'or',
    })
  ) {
    mediaLinks.push({
      text: intl.formatMessage(messages.play4konplex),
      url: data.mediaInfo?.plexUrl4k,
      svg: <PlayIcon />,
    });
  }

  const trailerUrl = data.relatedVideos
    ?.filter((r) => r.type === 'Trailer')
    .sort((a, b) => a.size - b.size)
    .pop()?.url;

  if (trailerUrl) {
    mediaLinks.push({
      text: intl.formatMessage(messages.watchtrailer),
      url: trailerUrl,
      svg: <FilmIcon />,
    });
  }

  const region = user?.settings?.region
    ? user.settings.region
    : settings.currentSettings.region
    ? settings.currentSettings.region
    : 'US';

  const releases = data.releases.results.find(
    (r) => r.iso_3166_1 === region
  )?.release_dates;

  // Release date types:
  // 1. Premiere
  // 2. Theatrical (limited)
  // 3. Theatrical
  // 4. Digital
  // 5. Physical
  // 6. TV
  const filteredReleases = uniqBy(
    releases?.filter((r) => r.type > 2 && r.type < 6),
    'type'
  );

  const movieAttributes: React.ReactNode[] = [];

  const certification = releases?.find((r) => r.certification)?.certification;
  if (certification) {
    movieAttributes.push(
      <span className="p-0.5 py-0 border rounded-md">{certification}</span>
    );
  }

  if (data.runtime) {
    movieAttributes.push(
      intl.formatMessage(messages.runtime, { minutes: data.runtime })
    );
  }

  if (data.genres.length) {
    movieAttributes.push(
      data.genres
        .map((g) => (
          <Link href={`/discover/movies/genre/${g.id}`} key={`genre-${g.id}`}>
            <a className="hover:underline">{g.name}</a>
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

  const streamingProviders =
    data?.watchProviders?.find((provider) => provider.iso_3166_1 === region)
      ?.flatrate ?? [];

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
      <PageTitle title={data.title} />
      <IssueModal
        onCancel={() => setShowIssueModal(false)}
        show={showIssueModal}
        mediaType="movie"
        tmdbId={data.id}
      />
      <ManageSlideOver
        data={data}
        mediaType="movie"
        onClose={() => setShowManager(false)}
        revalidate={() => revalidate()}
        show={showManager}
      />
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
              status={data.mediaInfo?.status}
              inProgress={(data.mediaInfo?.downloadStatus ?? []).length > 0}
              plexUrl={data.mediaInfo?.plexUrl}
              serviceUrl={
                hasPermission(Permission.ADMIN)
                  ? data.mediaInfo?.serviceUrl
                  : undefined
              }
            />
            {settings.currentSettings.movie4kEnabled &&
              hasPermission(
                [Permission.REQUEST_4K, Permission.REQUEST_4K_MOVIE],
                {
                  type: 'or',
                }
              ) && (
                <StatusBadge
                  status={data.mediaInfo?.status4k}
                  is4k
                  inProgress={
                    (data.mediaInfo?.downloadStatus4k ?? []).length > 0
                  }
                  plexUrl={data.mediaInfo?.plexUrl4k}
                  serviceUrl={
                    hasPermission(Permission.ADMIN)
                      ? data.mediaInfo?.serviceUrl4k
                      : undefined
                  }
                />
              )}
          </div>
          <h1>
            {data.title}{' '}
            {data.releaseDate && (
              <span className="media-year">
                ({data.releaseDate.slice(0, 4)})
              </span>
            )}
          </h1>
          <span className="media-attributes">
            {movieAttributes.length > 0 &&
              movieAttributes
                .map((t, k) => <span key={k}>{t}</span>)
                .reduce((prev, curr) => (
                  <>
                    {prev}
                    <span>|</span>
                    {curr}
                  </>
                ))}
          </span>
        </div>
        <div className="media-actions">
          <PlayButton links={mediaLinks} />
          <RequestButton
            mediaType="movie"
            media={data.mediaInfo}
            tmdbId={data.id}
            onUpdate={() => revalidate()}
          />
          {(data.mediaInfo?.status === MediaStatus.AVAILABLE ||
            (settings.currentSettings.movie4kEnabled &&
              hasPermission(
                [Permission.REQUEST_4K, Permission.REQUEST_4K_MOVIE],
                {
                  type: 'or',
                }
              ) &&
              data.mediaInfo?.status4k === MediaStatus.AVAILABLE)) &&
            hasPermission(
              [Permission.CREATE_ISSUES, Permission.MANAGE_ISSUES],
              {
                type: 'or',
              }
            ) && (
              <Button
                buttonType="warning"
                className="ml-2 first:ml-0"
                onClick={() => setShowIssueModal(true)}
              >
                <ExclamationIcon />
              </Button>
            )}
          {hasPermission(Permission.MANAGE_REQUESTS) && (
            <Button
              buttonType="default"
              className="relative ml-2 first:ml-0"
              onClick={() => setShowManager(true)}
            >
              <CogIcon className="!mr-0" />
              {hasPermission(
                [Permission.MANAGE_ISSUES, Permission.VIEW_ISSUES],
                {
                  type: 'or',
                }
              ) &&
                (
                  data.mediaInfo?.issues.filter(
                    (issue) => issue.status === IssueStatus.OPEN
                  ) ?? []
                ).length > 0 && (
                  <>
                    <div className="absolute w-3 h-3 bg-red-600 rounded-full -right-1 -top-1" />
                    <div className="absolute w-3 h-3 bg-red-600 rounded-full -right-1 -top-1 animate-ping" />
                  </>
                )}
            </Button>
          )}
        </div>
      </div>
      <div className="media-overview">
        <div className="media-overview-left">
          {data.tagline && <div className="tagline">{data.tagline}</div>}
          <h2>{intl.formatMessage(messages.overview)}</h2>
          <p>
            {data.overview
              ? data.overview
              : intl.formatMessage(messages.overviewunavailable)}
          </p>
          {sortedCrew.length > 0 && (
            <>
              <ul className="media-crew">
                {sortedCrew.slice(0, 6).map((person) => (
                  <li key={`crew-${person.job}-${person.id}`}>
                    <span>{person.job}</span>
                    <Link href={`/person/${person.id}`}>
                      <a className="crew-name">{person.name}</a>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end mt-4">
                <Link href={`/movie/${data.id}/crew`}>
                  <a className="flex items-center text-gray-400 transition duration-300 hover:text-gray-100">
                    <span>{intl.formatMessage(messages.viewfullcrew)}</span>
                    <ArrowCircleRightIcon className="inline-block w-5 h-5 ml-1.5" />
                  </a>
                </Link>
              </div>
            </>
          )}
        </div>
        <div className="media-overview-right">
          {data.collection && (
            <div className="mb-6">
              <Link href={`/collection/${data.collection.id}`}>
                <a>
                  <div className="relative z-0 overflow-hidden transition duration-300 scale-100 bg-gray-800 bg-center bg-cover rounded-lg shadow-md cursor-pointer transform-gpu group hover:scale-105 ring-1 ring-gray-700 hover:ring-gray-500">
                    <div className="absolute inset-0 z-0">
                      <CachedImage
                        src={`https://image.tmdb.org/t/p/w1440_and_h320_multi_faces/${data.collection.backdropPath}`}
                        alt=""
                        layout="fill"
                        objectFit="cover"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage:
                            'linear-gradient(180deg, rgba(31, 41, 55, 0.47) 0%, rgba(31, 41, 55, 0.80) 100%)',
                        }}
                      />
                    </div>
                    <div className="relative z-10 flex items-center justify-between p-4 text-gray-200 transition duration-300 h-14 group-hover:text-white">
                      <div>{data.collection.name}</div>
                      <Button buttonSize="sm">
                        {intl.formatMessage(globalMessages.view)}
                      </Button>
                    </div>
                  </div>
                </a>
              </Link>
            </div>
          )}
          <div className="media-facts">
            {(!!data.voteCount ||
              (ratingData?.criticsRating && !!ratingData?.criticsScore) ||
              (ratingData?.audienceRating && !!ratingData?.audienceScore)) && (
              <div className="media-ratings">
                {ratingData?.criticsRating && !!ratingData?.criticsScore && (
                  <>
                    <span className="media-rating">
                      {ratingData.criticsRating === 'Rotten' ? (
                        <RTRotten className="w-6 mr-1" />
                      ) : (
                        <RTFresh className="w-6 mr-1" />
                      )}
                      {ratingData.criticsScore}%
                    </span>
                  </>
                )}
                {ratingData?.audienceRating && !!ratingData?.audienceScore && (
                  <>
                    <span className="media-rating">
                      {ratingData.audienceRating === 'Spilled' ? (
                        <RTAudRotten className="w-6 mr-1" />
                      ) : (
                        <RTAudFresh className="w-6 mr-1" />
                      )}
                      {ratingData.audienceScore}%
                    </span>
                  </>
                )}
                {!!data.voteCount && (
                  <>
                    <span className="media-rating">
                      <TmdbLogo className="w-6 mr-2" />
                      {data.voteAverage}/10
                    </span>
                  </>
                )}
              </div>
            )}
            {data.originalTitle &&
              data.originalLanguage !== locale.slice(0, 2) && (
                <div className="media-fact">
                  <span>{intl.formatMessage(messages.originaltitle)}</span>
                  <span className="media-fact-value">{data.originalTitle}</span>
                </div>
              )}
            <div className="media-fact">
              <span>{intl.formatMessage(globalMessages.status)}</span>
              <span className="media-fact-value">{data.status}</span>
            </div>
            {filteredReleases && filteredReleases.length > 0 ? (
              <div className="media-fact">
                <span>
                  {intl.formatMessage(messages.releasedate, {
                    releaseCount: filteredReleases.length,
                  })}
                </span>
                <span className="media-fact-value">
                  {filteredReleases.map((r, i) => (
                    <span
                      className="flex items-center justify-end"
                      key={`release-date-${i}`}
                    >
                      {r.type === 3 ? (
                        // Theatrical
                        <TicketIcon className="w-4 h-4" />
                      ) : r.type === 4 ? (
                        // Digital
                        <CloudIcon className="w-4 h-4" />
                      ) : (
                        // Physical
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="m12 2c-5.5242 0-10 4.4758-10 10 0 5.5242 4.4758 10 10 10 5.5242 0 10-4.4758 10-10 0-5.5242-4.4758-10-10-10zm0 18.065c-4.4476 0-8.0645-3.6169-8.0645-8.0645 0-4.4476 3.6169-8.0645 8.0645-8.0645 4.4476 0 8.0645 3.6169 8.0645 8.0645 0 4.4476-3.6169 8.0645-8.0645 8.0645zm0-14.516c-3.5565 0-6.4516 2.8952-6.4516 6.4516h1.2903c0-2.8468 2.3145-5.1613 5.1613-5.1613zm0 2.9032c-1.9597 0-3.5484 1.5887-3.5484 3.5484s1.5887 3.5484 3.5484 3.5484 3.5484-1.5887 3.5484-3.5484-1.5887-3.5484-3.5484-3.5484zm0 4.8387c-0.71371 0-1.2903-0.57661-1.2903-1.2903s0.57661-1.2903 1.2903-1.2903 1.2903 0.57661 1.2903 1.2903-0.57661 1.2903-1.2903 1.2903z"
                            fill="currentColor"
                          />
                        </svg>
                      )}
                      <span className="ml-1.5">
                        {intl.formatDate(r.release_date, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </span>
                  ))}
                </span>
              </div>
            ) : (
              data.releaseDate && (
                <div className="media-fact">
                  <span>
                    {intl.formatMessage(messages.releasedate, {
                      releaseCount: 1,
                    })}
                  </span>
                  <span className="media-fact-value">
                    {intl.formatDate(data.releaseDate, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )
            )}
            {data.revenue > 0 && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.revenue)}</span>
                <span className="media-fact-value">
                  {intl.formatNumber(data.revenue, {
                    currency: 'USD',
                    style: 'currency',
                  })}
                </span>
              </div>
            )}
            {data.budget > 0 && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.budget)}</span>
                <span className="media-fact-value">
                  {intl.formatNumber(data.budget, {
                    currency: 'USD',
                    style: 'currency',
                  })}
                </span>
              </div>
            )}
            {data.originalLanguage && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.originallanguage)}</span>
                <span className="media-fact-value">
                  <Link
                    href={`/discover/movies/language/${data.originalLanguage}`}
                  >
                    <a>
                      {intl.formatDisplayName(data.originalLanguage, {
                        type: 'language',
                        fallback: 'none',
                      }) ??
                        data.spokenLanguages.find(
                          (lng) => lng.iso_639_1 === data.originalLanguage
                        )?.name}
                    </a>
                  </Link>
                </span>
              </div>
            )}
            {data.productionCountries.length > 0 && (
              <div className="media-fact">
                <span>
                  {intl.formatMessage(messages.productioncountries, {
                    countryCount: data.productionCountries.length,
                  })}
                </span>
                <span className="media-fact-value">
                  {data.productionCountries.map((c) => {
                    return (
                      <span
                        className="flex items-center justify-end"
                        key={`prodcountry-${c.iso_3166_1}`}
                      >
                        {hasFlag(c.iso_3166_1) && (
                          <span
                            className={`mr-1.5 text-xs leading-5 flag:${c.iso_3166_1}`}
                          />
                        )}
                        <span>
                          {intl.formatDisplayName(c.iso_3166_1, {
                            type: 'region',
                            fallback: 'none',
                          }) ?? c.name}
                        </span>
                      </span>
                    );
                  })}
                </span>
              </div>
            )}
            {data.productionCompanies.length > 0 && (
              <div className="media-fact">
                <span>
                  {intl.formatMessage(messages.studio, {
                    studioCount: data.productionCompanies.length,
                  })}
                </span>
                <span className="media-fact-value">
                  {data.productionCompanies
                    .slice(
                      0,
                      showAllStudios || showMoreStudios
                        ? data.productionCompanies.length
                        : minStudios
                    )
                    .map((s) => {
                      return (
                        <Link
                          href={`/discover/movies/studio/${s.id}`}
                          key={`studio-${s.id}`}
                        >
                          <a className="block">{s.name}</a>
                        </Link>
                      );
                    })}
                  {!showAllStudios && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreStudios(!showMoreStudios);
                      }}
                    >
                      <span className="flex items-center">
                        {intl.formatMessage(
                          !showMoreStudios
                            ? messages.showmore
                            : messages.showless
                        )}
                        {!showMoreStudios ? (
                          <ChevronDoubleDownIcon className="w-4 h-4 ml-1" />
                        ) : (
                          <ChevronDoubleUpIcon className="w-4 h-4 ml-1" />
                        )}
                      </span>
                    </button>
                  )}
                </span>
              </div>
            )}
            {!!streamingProviders.length && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.streamingproviders)}</span>
                <span className="media-fact-value">
                  {streamingProviders.map((p) => {
                    return (
                      <span className="block" key={`provider-${p.id}`}>
                        {p.name}
                      </span>
                    );
                  })}
                </span>
              </div>
            )}
            <div className="media-fact">
              <ExternalLinkBlock
                mediaType="movie"
                tmdbId={data.id}
                tvdbId={data.externalIds.tvdbId}
                imdbId={data.externalIds.imdbId}
                rtUrl={ratingData?.url}
                plexUrl={data.mediaInfo?.plexUrl ?? data.mediaInfo?.plexUrl4k}
              />
            </div>
          </div>
        </div>
      </div>
      {data.credits.cast.length > 0 && (
        <>
          <div className="slider-header">
            <Link href="/movie/[movieId]/cast" as={`/movie/${data.id}/cast`}>
              <a className="slider-title">
                <span>{intl.formatMessage(messages.cast)}</span>
                <ArrowCircleRightIcon />
              </a>
            </Link>
          </div>
          <Slider
            sliderKey="cast"
            isLoading={false}
            isEmpty={false}
            items={data.credits.cast.slice(0, 20).map((person) => (
              <PersonCard
                key={`cast-item-${person.id}`}
                personId={person.id}
                name={person.name}
                subName={person.character}
                profilePath={person.profilePath}
              />
            ))}
          />
        </>
      )}
      <MediaSlider
        sliderKey="recommendations"
        title={intl.formatMessage(messages.recommendations)}
        url={`/api/v1/movie/${router.query.movieId}/recommendations`}
        linkUrl={`/movie/${data.id}/recommendations`}
        hideWhenEmpty
      />
      <MediaSlider
        sliderKey="similar"
        title={intl.formatMessage(messages.similar)}
        url={`/api/v1/movie/${router.query.movieId}/similar`}
        linkUrl={`/movie/${data.id}/similar`}
        hideWhenEmpty
      />
      <div className="pb-8" />
    </div>
  );
};

export default MovieDetails;
