import RTAudFresh from '@app/assets/rt_aud_fresh.svg';
import RTAudRotten from '@app/assets/rt_aud_rotten.svg';
import RTFresh from '@app/assets/rt_fresh.svg';
import RTRotten from '@app/assets/rt_rotten.svg';
import TmdbLogo from '@app/assets/tmdb_logo.svg';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import type { PlayButtonLink } from '@app/components/Common/PlayButton';
import PlayButton from '@app/components/Common/PlayButton';
import StatusBadgeMini from '@app/components/Common/StatusBadgeMini';
import Tag from '@app/components/Common/Tag';
import Tooltip from '@app/components/Common/Tooltip';
import ExternalLinkBlock from '@app/components/ExternalLinkBlock';
import IssueModal from '@app/components/IssueModal';
import ManageSlideOver from '@app/components/ManageSlideOver';
import MediaSlider from '@app/components/MediaSlider';
import PersonCard from '@app/components/PersonCard';
import RequestButton from '@app/components/RequestButton';
import RequestModal from '@app/components/RequestModal';
import Slider from '@app/components/Slider';
import StatusBadge from '@app/components/StatusBadge';
import Season from '@app/components/TvDetails/Season';
import useDeepLinks from '@app/hooks/useDeepLinks';
import useLocale from '@app/hooks/useLocale';
import useSettings from '@app/hooks/useSettings';
import { Permission, useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import Error from '@app/pages/_error';
import { sortCrewPriority } from '@app/utils/creditHelpers';
import { Disclosure, Transition } from '@headlessui/react';
import {
  ArrowRightCircleIcon,
  CogIcon,
  ExclamationTriangleIcon,
  FilmIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import type { RTRating } from '@server/api/rottentomatoes';
import { ANIME_KEYWORD_ID } from '@server/api/themoviedb/constants';
import { IssueStatus } from '@server/constants/issue';
import { MediaRequestStatus, MediaStatus } from '@server/constants/media';
import type { Crew } from '@server/models/common';
import type { TvDetails as TvDetailsType } from '@server/models/Tv';
import { hasFlag } from 'country-flag-icons';
import 'country-flag-icons/3x2/flags.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  firstAirDate: 'First Air Date',
  nextAirDate: 'Next Air Date',
  originallanguage: 'Original Language',
  overview: 'Overview',
  cast: 'Cast',
  recommendations: 'Recommendations',
  similar: 'Similar Series',
  watchtrailer: 'Watch Trailer',
  overviewunavailable: 'Overview unavailable.',
  originaltitle: 'Original Title',
  showtype: 'Series Type',
  anime: 'Anime',
  network: '{networkCount, plural, one {Network} other {Networks}}',
  viewfullcrew: 'View Full Crew',
  playonplex: 'Play on Plex',
  play4konplex: 'Play in 4K on Plex',
  seasons: '{seasonCount, plural, one {# Season} other {# Seasons}}',
  episodeRuntime: 'Episode Runtime',
  episodeRuntimeMinutes: '{runtime} minutes',
  streamingproviders: 'Currently Streaming On',
  productioncountries:
    'Production {countryCount, plural, one {Country} other {Countries}}',
  reportissue: 'Report an Issue',
  manageseries: 'Manage Series',
  seasonstitle: 'Seasons',
  episodeCount: '{episodeCount, plural, one {# Episode} other {# Episodes}}',
  seasonnumber: 'Season {seasonNumber}',
  status4k: '4K {status}',
  rtcriticsscore: 'Rotten Tomatoes Tomatometer',
  rtaudiencescore: 'Rotten Tomatoes Audience Score',
  tmdbuserscore: 'TMDB User Score',
});

interface TvDetailsProps {
  tv?: TvDetailsType;
}

const TvDetails = ({ tv }: TvDetailsProps) => {
  const settings = useSettings();
  const { user, hasPermission } = useUser();
  const router = useRouter();
  const intl = useIntl();
  const { locale } = useLocale();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showManager, setShowManager] = useState(
    router.query.manage == '1' ? true : false
  );
  const [showIssueModal, setShowIssueModal] = useState(false);

  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<TvDetailsType>(`/api/v1/tv/${router.query.tvId}`, {
    fallbackData: tv,
  });

  const { data: ratingData } = useSWR<RTRating>(
    `/api/v1/tv/${router.query.tvId}/ratings`
  );

  const sortedCrew = useMemo(
    () => sortCrewPriority(data?.credits.crew ?? []),
    [data]
  );

  useEffect(() => {
    setShowManager(router.query.manage == '1' ? true : false);
  }, [router.query.manage]);

  const { plexUrl, plexUrl4k } = useDeepLinks({
    plexUrl: data?.mediaInfo?.plexUrl,
    plexUrl4k: data?.mediaInfo?.plexUrl4k,
    iOSPlexUrl: data?.mediaInfo?.iOSPlexUrl,
    iOSPlexUrl4k: data?.mediaInfo?.iOSPlexUrl4k,
  });

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <Error statusCode={404} />;
  }

  const mediaLinks: PlayButtonLink[] = [];

  if (plexUrl) {
    mediaLinks.push({
      text: intl.formatMessage(messages.playonplex),
      url: plexUrl,
      svg: <PlayIcon />,
    });
  }

  if (
    settings.currentSettings.series4kEnabled &&
    plexUrl4k &&
    hasPermission([Permission.REQUEST_4K, Permission.REQUEST_4K_TV], {
      type: 'or',
    })
  ) {
    mediaLinks.push({
      text: intl.formatMessage(messages.play4konplex),
      url: plexUrl4k,
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
  const seriesAttributes: React.ReactNode[] = [];

  const contentRating = data.contentRatings.results.find(
    (r) => r.iso_3166_1 === region
  )?.rating;
  if (contentRating) {
    seriesAttributes.push(
      <span className="rounded-md border p-0.5 py-0">{contentRating}</span>
    );
  }

  const seasonCount = data.seasons.filter(
    (season) => season.seasonNumber !== 0 && season.episodeCount !== 0
  ).length;

  if (seasonCount) {
    seriesAttributes.push(
      intl.formatMessage(messages.seasons, { seasonCount: seasonCount })
    );
  }

  if (data.genres.length) {
    seriesAttributes.push(
      data.genres
        .map((g) => (
          <Link href={`/discover/tv?genre=${g.id}`} key={`genre-${g.id}`}>
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

  const getAllRequestedSeasons = (is4k: boolean): number[] => {
    const requestedSeasons = (data?.mediaInfo?.requests ?? [])
      .filter(
        (request) =>
          request.is4k === is4k &&
          request.status !== MediaRequestStatus.DECLINED
      )
      .reduce((requestedSeasons, request) => {
        return [
          ...requestedSeasons,
          ...request.seasons.map((sr) => sr.seasonNumber),
        ];
      }, [] as number[]);

    const availableSeasons = (data?.mediaInfo?.seasons ?? [])
      .filter(
        (season) =>
          (season[is4k ? 'status4k' : 'status'] === MediaStatus.AVAILABLE ||
            season[is4k ? 'status4k' : 'status'] ===
              MediaStatus.PARTIALLY_AVAILABLE ||
            season[is4k ? 'status4k' : 'status'] === MediaStatus.PROCESSING) &&
          !requestedSeasons.includes(season.seasonNumber)
      )
      .map((season) => season.seasonNumber);

    return [...requestedSeasons, ...availableSeasons];
  };

  const isComplete = seasonCount <= getAllRequestedSeasons(false).length;

  const is4kComplete = seasonCount <= getAllRequestedSeasons(true).length;

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
      <PageTitle title={data.name} />
      <IssueModal
        onCancel={() => setShowIssueModal(false)}
        show={showIssueModal}
        mediaType="tv"
        tmdbId={data.id}
      />
      <RequestModal
        tmdbId={data.id}
        show={showRequestModal}
        type="tv"
        onComplete={() => {
          revalidate();
          setShowRequestModal(false);
        }}
        onCancel={() => setShowRequestModal(false)}
      />
      <ManageSlideOver
        data={data}
        mediaType="tv"
        onClose={() => {
          setShowManager(false);
          router.push({
            pathname: router.pathname,
            query: { tvId: router.query.tvId },
          });
        }}
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
              downloadItem={data.mediaInfo?.downloadStatus}
              title={data.name}
              inProgress={(data.mediaInfo?.downloadStatus ?? []).length > 0}
              tmdbId={data.mediaInfo?.tmdbId}
              mediaType="tv"
              plexUrl={plexUrl}
              serviceUrl={data.mediaInfo?.serviceUrl}
            />
            {settings.currentSettings.series4kEnabled &&
              hasPermission(
                [
                  Permission.MANAGE_REQUESTS,
                  Permission.REQUEST_4K,
                  Permission.REQUEST_4K_TV,
                ],
                {
                  type: 'or',
                }
              ) && (
                <StatusBadge
                  status={data.mediaInfo?.status4k}
                  downloadItem={data.mediaInfo?.downloadStatus4k}
                  title={data.name}
                  is4k
                  inProgress={
                    (data.mediaInfo?.downloadStatus4k ?? []).length > 0
                  }
                  tmdbId={data.mediaInfo?.tmdbId}
                  mediaType="tv"
                  plexUrl={plexUrl4k}
                  serviceUrl={data.mediaInfo?.serviceUrl4k}
                />
              )}
          </div>
          <h1 data-testid="media-title">
            {data.name}{' '}
            {data.firstAirDate && (
              <span className="media-year">
                ({data.firstAirDate.slice(0, 4)})
              </span>
            )}
          </h1>
          <span className="media-attributes">
            {seriesAttributes.length > 0 &&
              seriesAttributes
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
            mediaType="tv"
            onUpdate={() => revalidate()}
            tmdbId={data?.id}
            media={data?.mediaInfo}
            isShowComplete={isComplete}
            is4kShowComplete={is4kComplete}
          />
          {(data.mediaInfo?.status === MediaStatus.AVAILABLE ||
            data.mediaInfo?.status === MediaStatus.PARTIALLY_AVAILABLE ||
            (settings.currentSettings.series4kEnabled &&
              hasPermission([Permission.REQUEST_4K, Permission.REQUEST_4K_TV], {
                type: 'or',
              }) &&
              (data.mediaInfo?.status4k === MediaStatus.AVAILABLE ||
                data?.mediaInfo?.status4k ===
                  MediaStatus.PARTIALLY_AVAILABLE))) &&
            hasPermission(
              [Permission.CREATE_ISSUES, Permission.MANAGE_ISSUES],
              {
                type: 'or',
              }
            ) && (
              <Tooltip content={intl.formatMessage(messages.reportissue)}>
                <Button
                  buttonType="warning"
                  onClick={() => setShowIssueModal(true)}
                  className="ml-2 first:ml-0"
                >
                  <ExclamationTriangleIcon />
                </Button>
              </Tooltip>
            )}
          {hasPermission(Permission.MANAGE_REQUESTS) && data.mediaInfo && (
            <Tooltip content={intl.formatMessage(messages.manageseries)}>
              <Button
                buttonType="ghost"
                onClick={() => setShowManager(true)}
                className="relative ml-2 first:ml-0"
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
                      <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-600" />
                      <div className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-red-600" />
                    </>
                  )}
              </Button>
            </Tooltip>
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
                {(data.createdBy.length > 0
                  ? [
                      ...data.createdBy.map(
                        (person): Partial<Crew> => ({
                          id: person.id,
                          job: 'Creator',
                          name: person.name,
                        })
                      ),
                      ...sortedCrew,
                    ]
                  : sortedCrew
                )
                  .slice(0, 6)
                  .map((person) => (
                    <li key={`crew-${person.job}-${person.id}`}>
                      <span>{person.job}</span>
                      <Link href={`/person/${person.id}`}>
                        <a className="crew-name">{person.name}</a>
                      </Link>
                    </li>
                  ))}
              </ul>
              <div className="mt-4 flex justify-end">
                <Link href={`/tv/${data.id}/crew`}>
                  <a className="flex items-center text-gray-400 transition duration-300 hover:text-gray-100">
                    <span>{intl.formatMessage(messages.viewfullcrew)}</span>
                    <ArrowRightCircleIcon className="ml-1.5 inline-block h-5 w-5" />
                  </a>
                </Link>
              </div>
            </>
          )}
          {data.keywords.length > 0 && (
            <div className="mt-6">
              {data.keywords.map((keyword) => (
                <Link
                  href={`/discover/tv?keywords=${keyword.id}`}
                  key={`keyword-id-${keyword.id}`}
                >
                  <a className="mb-2 mr-2 inline-flex last:mr-0">
                    <Tag>{keyword.name}</Tag>
                  </a>
                </Link>
              ))}
            </div>
          )}
          <h2 className="py-4">{intl.formatMessage(messages.seasonstitle)}</h2>
          <div className="flex w-full flex-col space-y-2">
            {data.seasons
              .slice()
              .reverse()
              .filter((season) => season.seasonNumber !== 0)
              .map((season) => {
                const show4k =
                  settings.currentSettings.series4kEnabled &&
                  hasPermission(
                    [
                      Permission.MANAGE_REQUESTS,
                      Permission.REQUEST_4K,
                      Permission.REQUEST_4K_TV,
                    ],
                    {
                      type: 'or',
                    }
                  );
                const mSeason = (data.mediaInfo?.seasons ?? []).find(
                  (s) =>
                    season.seasonNumber === s.seasonNumber &&
                    s.status !== MediaStatus.UNKNOWN
                );
                const mSeason4k = (data.mediaInfo?.seasons ?? []).find(
                  (s) =>
                    season.seasonNumber === s.seasonNumber &&
                    s.status4k !== MediaStatus.UNKNOWN
                );
                const request = (data.mediaInfo?.requests ?? []).find(
                  (r) =>
                    !!r.seasons.find(
                      (s) => s.seasonNumber === season.seasonNumber
                    ) && !r.is4k
                );
                const request4k = (data.mediaInfo?.requests ?? []).find(
                  (r) =>
                    !!r.seasons.find(
                      (s) => s.seasonNumber === season.seasonNumber
                    ) && r.is4k
                );

                if (season.episodeCount === 0) {
                  return null;
                }

                return (
                  <Disclosure key={`season-discoslure-${season.seasonNumber}`}>
                    {({ open }) => (
                      <>
                        <Disclosure.Button
                          className={`mt-2 flex w-full items-center justify-between space-x-2 border-gray-700 bg-gray-800 px-4 py-2 text-gray-200 ${
                            open
                              ? 'rounded-t-md border-t border-l border-r'
                              : 'rounded-md border'
                          }`}
                        >
                          <div className="flex flex-1 items-center space-x-2 text-lg">
                            <span>
                              {intl.formatMessage(messages.seasonnumber, {
                                seasonNumber: season.seasonNumber,
                              })}
                            </span>
                            <Badge badgeType="dark">
                              {intl.formatMessage(messages.episodeCount, {
                                episodeCount: season.episodeCount,
                              })}
                            </Badge>
                          </div>
                          {((!mSeason &&
                            request?.status === MediaRequestStatus.APPROVED) ||
                            mSeason?.status === MediaStatus.PROCESSING) && (
                            <>
                              <div className="hidden md:flex">
                                <Badge badgeType="primary">
                                  {intl.formatMessage(globalMessages.requested)}
                                </Badge>
                              </div>
                              <div className="flex md:hidden">
                                <StatusBadgeMini
                                  status={MediaStatus.PROCESSING}
                                />
                              </div>
                            </>
                          )}
                          {((!mSeason &&
                            request?.status === MediaRequestStatus.PENDING) ||
                            mSeason?.status === MediaStatus.PENDING) && (
                            <>
                              <div className="hidden md:flex">
                                <Badge badgeType="warning">
                                  {intl.formatMessage(globalMessages.pending)}
                                </Badge>
                              </div>
                              <div className="flex md:hidden">
                                <StatusBadgeMini status={MediaStatus.PENDING} />
                              </div>
                            </>
                          )}
                          {mSeason?.status ===
                            MediaStatus.PARTIALLY_AVAILABLE && (
                            <>
                              <div className="hidden md:flex">
                                <Badge badgeType="success">
                                  {intl.formatMessage(
                                    globalMessages.partiallyavailable
                                  )}
                                </Badge>
                              </div>
                              <div className="flex md:hidden">
                                <StatusBadgeMini
                                  status={MediaStatus.PARTIALLY_AVAILABLE}
                                />
                              </div>
                            </>
                          )}
                          {mSeason?.status === MediaStatus.AVAILABLE && (
                            <>
                              <div className="hidden md:flex">
                                <Badge badgeType="success">
                                  {intl.formatMessage(globalMessages.available)}
                                </Badge>
                              </div>
                              <div className="flex md:hidden">
                                <StatusBadgeMini
                                  status={MediaStatus.AVAILABLE}
                                />
                              </div>
                            </>
                          )}
                          {((!mSeason4k &&
                            request4k?.status ===
                              MediaRequestStatus.APPROVED) ||
                            mSeason4k?.status4k === MediaStatus.PROCESSING) &&
                            show4k && (
                              <>
                                <div className="hidden md:flex">
                                  <Badge badgeType="primary">
                                    {intl.formatMessage(messages.status4k, {
                                      status: intl.formatMessage(
                                        globalMessages.requested
                                      ),
                                    })}
                                  </Badge>
                                </div>
                                <div className="flex md:hidden">
                                  <StatusBadgeMini
                                    status={MediaStatus.PROCESSING}
                                    is4k={true}
                                  />
                                </div>
                              </>
                            )}
                          {((!mSeason4k &&
                            request4k?.status === MediaRequestStatus.PENDING) ||
                            mSeason?.status4k === MediaStatus.PENDING) &&
                            show4k && (
                              <>
                                <div className="hidden md:flex">
                                  <Badge badgeType="warning">
                                    {intl.formatMessage(messages.status4k, {
                                      status: intl.formatMessage(
                                        globalMessages.pending
                                      ),
                                    })}
                                  </Badge>
                                </div>
                                <div className="flex md:hidden">
                                  <StatusBadgeMini
                                    status={MediaStatus.PENDING}
                                    is4k={true}
                                  />
                                </div>
                              </>
                            )}
                          {mSeason4k?.status4k ===
                            MediaStatus.PARTIALLY_AVAILABLE &&
                            show4k && (
                              <>
                                <div className="hidden md:flex">
                                  <Badge badgeType="success">
                                    {intl.formatMessage(messages.status4k, {
                                      status: intl.formatMessage(
                                        globalMessages.partiallyavailable
                                      ),
                                    })}
                                  </Badge>
                                </div>
                                <div className="flex md:hidden">
                                  <StatusBadgeMini
                                    status={MediaStatus.PARTIALLY_AVAILABLE}
                                    is4k={true}
                                  />
                                </div>
                              </>
                            )}
                          {mSeason4k?.status4k === MediaStatus.AVAILABLE &&
                            show4k && (
                              <>
                                <div className="hidden md:flex">
                                  <Badge badgeType="success">
                                    {intl.formatMessage(messages.status4k, {
                                      status: intl.formatMessage(
                                        globalMessages.available
                                      ),
                                    })}
                                  </Badge>
                                </div>
                                <div className="flex md:hidden">
                                  <StatusBadgeMini
                                    status={MediaStatus.AVAILABLE}
                                    is4k={true}
                                  />
                                </div>
                              </>
                            )}
                          <ChevronDownIcon
                            className={`${
                              open ? 'rotate-180 transform' : ''
                            } h-6 w-6 text-gray-500`}
                          />
                        </Disclosure.Button>
                        <Transition
                          show={open}
                          enter="transition duration-100 ease-out"
                          enterFrom="transform opacity-0"
                          enterTo="transform opacity-100"
                          leave="transition duration-75 ease-out"
                          leaveFrom="transform opacity-100"
                          leaveTo="transform opacity-0"
                          // Not sure why this transition is adding a margin without this here
                          style={{ margin: '0px' }}
                        >
                          <Disclosure.Panel className="w-full rounded-b-md border-b border-l border-r border-gray-700 px-4 pb-2">
                            <Season
                              tvId={data.id}
                              seasonNumber={season.seasonNumber}
                            />
                          </Disclosure.Panel>
                        </Transition>
                      </>
                    )}
                  </Disclosure>
                );
              })}
          </div>
        </div>
        <div className="media-overview-right">
          <div className="media-facts">
            {(!!data.voteCount ||
              (ratingData?.criticsRating && !!ratingData?.criticsScore) ||
              (ratingData?.audienceRating && !!ratingData?.audienceScore)) && (
              <div className="media-ratings">
                {ratingData?.criticsRating && !!ratingData?.criticsScore && (
                  <Tooltip
                    content={intl.formatMessage(messages.rtcriticsscore)}
                  >
                    <a
                      href={ratingData.url}
                      className="media-rating"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {ratingData.criticsRating === 'Rotten' ? (
                        <RTRotten className="mr-1 w-6" />
                      ) : (
                        <RTFresh className="mr-1 w-6" />
                      )}
                      <span>{ratingData.criticsScore}%</span>
                    </a>
                  </Tooltip>
                )}
                {ratingData?.audienceRating && !!ratingData?.audienceScore && (
                  <Tooltip
                    content={intl.formatMessage(messages.rtaudiencescore)}
                  >
                    <a
                      href={ratingData.url}
                      className="media-rating"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {ratingData.audienceRating === 'Spilled' ? (
                        <RTAudRotten className="mr-1 w-6" />
                      ) : (
                        <RTAudFresh className="mr-1 w-6" />
                      )}
                      <span>{ratingData.audienceScore}%</span>
                    </a>
                  </Tooltip>
                )}
                {!!data.voteCount && (
                  <Tooltip content={intl.formatMessage(messages.tmdbuserscore)}>
                    <a
                      href={`https://www.themoviedb.org/tv/${data.id}?language=${locale}`}
                      className="media-rating"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <TmdbLogo className="mr-1 w-6" />
                      <span>{Math.round(data.voteAverage * 10)}%</span>
                    </a>
                  </Tooltip>
                )}
              </div>
            )}
            {data.originalName &&
              data.originalLanguage !== locale.slice(0, 2) && (
                <div className="media-fact">
                  <span>{intl.formatMessage(messages.originaltitle)}</span>
                  <span className="media-fact-value">{data.originalName}</span>
                </div>
              )}
            {data.keywords.some(
              (keyword) => keyword.id === ANIME_KEYWORD_ID
            ) && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.showtype)}</span>
                <span className="media-fact-value">
                  {intl.formatMessage(messages.anime)}
                </span>
              </div>
            )}
            <div className="media-fact">
              <span>{intl.formatMessage(globalMessages.status)}</span>
              <span className="media-fact-value">{data.status}</span>
            </div>
            {data.firstAirDate && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.firstAirDate)}</span>
                <span className="media-fact-value">
                  {intl.formatDate(data.firstAirDate, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'UTC',
                  })}
                </span>
              </div>
            )}
            {data.nextEpisodeToAir &&
              data.nextEpisodeToAir.airDate &&
              data.nextEpisodeToAir.airDate !== data.firstAirDate && (
                <div className="media-fact">
                  <span>{intl.formatMessage(messages.nextAirDate)}</span>
                  <span className="media-fact-value">
                    {intl.formatDate(data.nextEpisodeToAir.airDate, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      timeZone: 'UTC',
                    })}
                  </span>
                </div>
              )}
            {data.episodeRunTime.length > 0 && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.episodeRuntime)}</span>
                <span className="media-fact-value">
                  {intl.formatMessage(messages.episodeRuntimeMinutes, {
                    runtime: data.episodeRunTime[0],
                  })}
                </span>
              </div>
            )}
            {data.originalLanguage && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.originallanguage)}</span>
                <span className="media-fact-value">
                  <Link href={`/discover/tv/language/${data.originalLanguage}`}>
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
            {data.networks.length > 0 && (
              <div className="media-fact">
                <span>
                  {intl.formatMessage(messages.network, {
                    networkCount: data.networks.length,
                  })}
                </span>
                <span className="media-fact-value">
                  {data.networks
                    .map((n) => (
                      <Link
                        href={`/discover/tv/network/${n.id}`}
                        key={`network-${n.id}`}
                      >
                        <a>{n.name}</a>
                      </Link>
                    ))
                    .reduce((prev, curr) => (
                      <>
                        {intl.formatMessage(globalMessages.delimitedlist, {
                          a: prev,
                          b: curr,
                        })}
                      </>
                    ))}
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
                mediaType="tv"
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
            <Link href="/tv/[tvId]/cast" as={`/tv/${data.id}/cast`}>
              <a className="slider-title">
                <span>{intl.formatMessage(messages.cast)}</span>
                <ArrowRightCircleIcon />
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
        url={`/api/v1/tv/${router.query.tvId}/recommendations`}
        linkUrl={`/tv/${data.id}/recommendations`}
        hideWhenEmpty
      />
      <MediaSlider
        sliderKey="similar"
        title={intl.formatMessage(messages.similar)}
        url={`/api/v1/tv/${router.query.tvId}/similar`}
        linkUrl={`/tv/${data.id}/similar`}
        hideWhenEmpty
      />
      <div className="extra-bottom-space relative" />
    </div>
  );
};

export default TvDetails;
