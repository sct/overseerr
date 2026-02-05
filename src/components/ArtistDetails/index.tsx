import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import ExternalLinkBlock from '@app/components/ExternalLinkBlock';
import ManageSlideOver from '@app/components/ManageSlideOver';
import RequestButton from '@app/components/RequestButton';
import Slider from '@app/components/Slider';
import StatusBadge from '@app/components/StatusBadge';
import AlbumTitleCard from '@app/components/TitleCard/AlbumTitleCard';
import TrackTitleCard from '@app/components/TitleCard/TrackTitleCard';
import { Permission, useUser } from '@app/hooks/useUser';
import Error from '@app/pages/_error';
import { refreshIntervalHelper } from '@app/utils/refreshIntervalHelper';
import {
  CalendarIcon,
  CircleStackIcon,
  CogIcon,
  MapPinIcon,
  MusicalNoteIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import type Media from '@server/entity/Media';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  overview: 'Overview',
  overviewunavailable: 'Overview unavailable.',
  discography: 'Discography',
  topSongs: 'Top Songs',
  topAlbums: 'Top Albums',
  albums: 'Albums',
  country: 'Country',
  type: 'Type',
  area: 'Area',
  manageartist: 'Manage Artist',
  formed: 'Formed',
  ended: 'Ended',
  members: 'Members',
  releases: 'Releases',
  popularTracks: 'Popular Tracks',
  biography: 'Biography',
  relatedArtists: 'Related Artists',
  externalLinks: 'External Links',
  artistInfo: 'Artist Info',
});

interface ArtistDetails {
  id: string;
  name: string;
  sortName?: string;
  disambiguation?: string;
  country?: string;
  type?: string;
  area?: { id: string; name: string };
  lifeSpan?: {
    begin?: string;
    end?: string;
    ended?: boolean;
  };
  tags?: { name: string; count: number }[];
  releaseGroups?: {
    id: string;
    title: string;
    'primary-type'?: string;
    'first-release-date'?: string;
    'artist-credit'?: {
      artist: { id: string; name: string };
      name?: string;
    }[];
  }[];
  relations?: {
    type: string;
    artist?: {
      id: string;
      name: string;
    };
  }[];
  mediaInfo?: Media;
  fanartThumbnail?: string;
  fanartLogo?: string;
  fanartBackground?: string;
  imageUrl?: string;
}

interface TopTracksResponse {
  results: {
    id: string;
    title?: string;
  }[];
}

const ArtistDetails = () => {
  const { hasPermission } = useUser();
  const router = useRouter();
  const intl = useIntl();
  const [showManager, setShowManager] = useState(
    router.query.manage == '1' ? true : false
  );

  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<ArtistDetails>(`/api/v1/music/artist/${router.query.mbid}`, {
    refreshInterval: (currentData) =>
      refreshIntervalHelper(
        {
          downloadStatus: currentData?.mediaInfo?.downloadStatus,
          downloadStatus4k: undefined,
        },
        15000
      ),
  });

  const artistId =
    typeof router.query.mbid === 'string' ? router.query.mbid : '';

  const { data: topTracksData, error: topTracksError } =
    useSWR<TopTracksResponse>(
      artistId ? `/api/v1/music/artist/${artistId}/top-tracks` : null
    );

  useEffect(() => {
    setShowManager(router.query.manage == '1' ? true : false);
  }, [router.query.manage]);

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    const statusCode =
      (error as { response?: { status?: number } })?.response?.status ?? 404;
    return <Error statusCode={statusCode} />;
  }

  const topTracks = topTracksData?.results ?? [];
  const topAlbums =
    data.releaseGroups?.filter((rg) => rg['primary-type'] === 'Album') ?? [];
  const allAlbums = data.releaseGroups ?? [];

  return (
    <div className="media-page">
      <PageTitle title={data.name} />
      <ManageSlideOver
        data={data}
        mediaType="artist"
        onClose={() => {
          setShowManager(false);
          router.push({
            pathname: router.pathname,
            query: { mbid: router.query.mbid },
          });
        }}
        revalidate={() => revalidate()}
        show={showManager}
      />

      {/* Hero Section */}
      <div className="relative mt-4 overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-indigo-900/40 to-purple-900/30 px-6 py-8 shadow-2xl sm:px-8">
        {/* Decorative background elements */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-1/3 h-32 w-32 rounded-full bg-blue-500/5 blur-2xl" />

        <div className="media-header relative">
          {/* Artist Image */}
          <div className="relative h-36 w-36 overflow-hidden rounded-full border-2 border-indigo-400/30 bg-gray-800 shadow-2xl ring-4 ring-indigo-400/20 sm:h-44 sm:w-44 xl:h-52 xl:w-52">
            <CachedImage
              src={
                data.imageUrl ||
                '/images/overseerr_poster_not_found_logo_center.png'
              }
              alt={data.name}
              layout="fill"
              objectFit="cover"
              className="rounded-full"
              priority
            />
          </div>

          {/* Artist Info */}
          <div className="media-title">
            <div className="media-status">
              <StatusBadge
                status={data.mediaInfo?.status}
                downloadItem={data.mediaInfo?.downloadStatus}
                title={data.name}
                inProgress={(data.mediaInfo?.downloadStatus ?? []).length > 0}
                tmdbId={undefined}
                mediaType="artist"
                serviceUrl={data.mediaInfo?.serviceUrl}
              />
            </div>
            <h1 data-testid="media-title" className="text-3xl xl:text-4xl">
              {data.name}
              {data.disambiguation && (
                <span className="media-year text-xl text-gray-400">
                  {' '}
                  ({data.disambiguation})
                </span>
              )}
            </h1>

            {/* Quick Stats */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-400">
              {data.type && (
                <span className="flex items-center gap-1.5 rounded-full bg-gray-800/80 px-3 py-1">
                  <UsersIcon className="h-4 w-4 text-indigo-400" />
                  {data.type}
                </span>
              )}
              {data.country && (
                <span className="flex items-center gap-1.5 rounded-full bg-gray-800/80 px-3 py-1">
                  <MapPinIcon className="h-4 w-4 text-indigo-400" />
                  {data.country}
                </span>
              )}
              {data.lifeSpan?.begin && (
                <span className="flex items-center gap-1.5 rounded-full bg-gray-800/80 px-3 py-1">
                  <CalendarIcon className="h-4 w-4 text-indigo-400" />
                  {data.lifeSpan.begin}
                  {data.lifeSpan.end && ` - ${data.lifeSpan.end}`}
                </span>
              )}
              {allAlbums.length > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-gray-800/80 px-3 py-1">
                  <CircleStackIcon className="h-4 w-4 text-indigo-400" />
                  {allAlbums.length}{' '}
                  {allAlbums.length === 1 ? 'Album' : 'Albums'}
                </span>
              )}
            </div>

            {/* Tags */}
            {data.tags && data.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {data.tags.slice(0, 8).map((tag) => (
                  <span
                    key={`tag-${tag.name}`}
                    className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300 ring-1 ring-indigo-500/30 transition-colors hover:bg-indigo-500/30"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="media-actions">
            <RequestButton
              mediaType="artist"
              onUpdate={() => revalidate()}
              mbid={data.id}
              media={data.mediaInfo}
            />
            {hasPermission(Permission.MANAGE_REQUESTS) && data.mediaInfo && (
              <Button
                buttonType="ghost"
                onClick={() => setShowManager(true)}
                className="relative ml-2 first:ml-0"
              >
                <CogIcon className="!mr-0" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="media-overview">
        <div className="media-overview-left space-y-8">
          {/* Biography Placeholder - could be populated with data from API */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
                <MusicalNoteIcon className="h-5 w-5 text-indigo-400" />
              </span>
              {intl.formatMessage(messages.biography)}
            </h2>
            <p className="leading-relaxed text-gray-400">
              {data.name} is a {data.type?.toLowerCase() || 'artist'}
              {data.country ? ` from ${data.country}` : ''}
              {data.area ? `, based in ${data.area.name}` : ''}.
              {allAlbums.length > 0 &&
                ` With ${allAlbums.length} releases in their discography, they have established themselves in the music industry.`}
            </p>
          </section>

          {/* Discography */}
          {allAlbums.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
                  <CircleStackIcon className="h-5 w-5 text-indigo-400" />
                </span>
                {intl.formatMessage(messages.discography)}
              </h2>
              <Slider
                sliderKey="albums"
                isLoading={false}
                isEmpty={false}
                items={allAlbums.slice(0, 20).map((rg) => (
                  <AlbumTitleCard
                    key={`album-${rg.id}`}
                    id={rg.id}
                    mbid={rg.id}
                  />
                ))}
              />
            </section>
          )}

          {/* Top Songs */}
          {(topTracks.length > 0 || (!topTracksData && !topTracksError)) && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
                  <MusicalNoteIcon className="h-5 w-5 text-indigo-400" />
                </span>
                {intl.formatMessage(messages.popularTracks)}
              </h2>
              <Slider
                sliderKey="top-songs"
                isLoading={!topTracksData && !topTracksError}
                isEmpty={topTracksData?.results?.length === 0}
                items={topTracks.slice(0, 12).map((track) => (
                  <TrackTitleCard
                    key={`track-${track.id}`}
                    id={track.id}
                    mbid={track.id}
                  />
                ))}
              />
            </section>
          )}

          {/* Top Albums */}
          {topAlbums.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
                  <CircleStackIcon className="h-5 w-5 text-indigo-400" />
                </span>
                {intl.formatMessage(messages.topAlbums)}
              </h2>
              <Slider
                sliderKey="top-albums"
                isLoading={false}
                isEmpty={false}
                items={topAlbums.slice(0, 12).map((rg) => (
                  <AlbumTitleCard
                    key={`top-album-${rg.id}`}
                    id={rg.id}
                    mbid={rg.id}
                  />
                ))}
              />
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="media-overview-right">
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-xl backdrop-blur-sm">
            <h3 className="mb-4 text-lg font-semibold text-white">
              {intl.formatMessage(messages.artistInfo)}
            </h3>

            <div className="space-y-4">
              {data.country && (
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <span className="text-gray-400">
                    {intl.formatMessage(messages.country)}
                  </span>
                  <span className="font-medium text-white">{data.country}</span>
                </div>
              )}
              {data.type && (
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <span className="text-gray-400">
                    {intl.formatMessage(messages.type)}
                  </span>
                  <span className="font-medium text-white">{data.type}</span>
                </div>
              )}
              {data.area && (
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <span className="text-gray-400">
                    {intl.formatMessage(messages.area)}
                  </span>
                  <span className="font-medium text-white">
                    {data.area.name}
                  </span>
                </div>
              )}
              {data.lifeSpan?.begin && (
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <span className="text-gray-400">
                    {intl.formatMessage(messages.formed)}
                  </span>
                  <span className="font-medium text-white">
                    {data.lifeSpan.begin}
                  </span>
                </div>
              )}
              {data.lifeSpan?.end && (
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <span className="text-gray-400">
                    {intl.formatMessage(messages.ended)}
                  </span>
                  <span className="font-medium text-white">
                    {data.lifeSpan.end}
                  </span>
                </div>
              )}

              <div className="pt-2">
                <ExternalLinkBlock
                  mediaType="artist"
                  mbid={data.id}
                  serviceUrl={data.mediaInfo?.serviceUrl}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="extra-bottom-space relative" />
    </div>
  );
};

export default ArtistDetails;
