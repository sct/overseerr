import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import Tag from '@app/components/Common/Tag';
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
import { CogIcon } from '@heroicons/react/24/outline';
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
  imageUrl?: string;
  mediaInfo?: {
    status?: number;
    downloadStatus?: unknown[];
    requests?: unknown[];
    serviceUrl?: string;
  };
}

interface TopTracksResponse {
  results: {
    id: string;
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
      <div className="relative mt-4 overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-indigo-900/40 to-gray-900 px-6 py-8 shadow-xl sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="media-header relative">
          <div className="relative h-36 w-36 overflow-hidden rounded-full border border-gray-700 bg-gray-800 shadow-2xl ring-2 ring-indigo-400/60 sm:h-44 sm:w-44 xl:h-48 xl:w-48">
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
            <h1 data-testid="media-title">
              {data.name}
              {data.disambiguation && (
                <span className="media-year"> ({data.disambiguation})</span>
              )}
            </h1>
            <span className="media-attributes">
              {data.type && <span>{data.type}</span>}
              {data.country && (
                <>
                  {data.type && <span>|</span>}
                  <span>{data.country}</span>
                </>
              )}
              {data.area && (
                <>
                  {(data.type || data.country) && <span>|</span>}
                  <span>{data.area.name}</span>
                </>
              )}
            </span>
          </div>
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
      <div className="media-overview">
        <div className="media-overview-left">
          <h2>{intl.formatMessage(messages.overview)}</h2>
          <p>{intl.formatMessage(messages.overviewunavailable)}</p>
          {data.tags && data.tags.length > 0 && (
            <div className="mt-6">
              {data.tags.map((tag) => (
                <span
                  key={`tag-${tag.name}`}
                  className="mb-2 mr-2 inline-flex last:mr-0"
                >
                  <Tag>{tag.name}</Tag>
                </span>
              ))}
            </div>
          )}
          {data.releaseGroups && data.releaseGroups.length > 0 && (
            <>
              <h2 className="py-4">
                {intl.formatMessage(messages.discography)}
              </h2>
              <Slider
                sliderKey="albums"
                isLoading={false}
                isEmpty={false}
                items={data.releaseGroups.slice(0, 20).map((rg) => (
                  <AlbumTitleCard
                    key={`album-${rg.id}`}
                    id={rg.id}
                    mbid={rg.id}
                  />
                ))}
              />
            </>
          )}
          {(topTracks.length > 0 || (!topTracksData && !topTracksError)) && (
            <>
              <h2 className="py-4">{intl.formatMessage(messages.topSongs)}</h2>
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
            </>
          )}
          {topAlbums.length > 0 && (
            <>
              <h2 className="py-4">{intl.formatMessage(messages.topAlbums)}</h2>
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
            </>
          )}
        </div>
        <div className="media-overview-right">
          <div className="media-facts">
            {data.country && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.country)}</span>
                <span className="media-fact-value">{data.country}</span>
              </div>
            )}
            {data.type && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.type)}</span>
                <span className="media-fact-value">{data.type}</span>
              </div>
            )}
            {data.area && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.area)}</span>
                <span className="media-fact-value">{data.area.name}</span>
              </div>
            )}
            {data.lifeSpan && (
              <>
                {data.lifeSpan.begin && (
                  <div className="media-fact">
                    <span>Started</span>
                    <span className="media-fact-value">
                      {data.lifeSpan.begin}
                    </span>
                  </div>
                )}
                {data.lifeSpan.end && (
                  <div className="media-fact">
                    <span>Ended</span>
                    <span className="media-fact-value">
                      {data.lifeSpan.end}
                    </span>
                  </div>
                )}
              </>
            )}
            <div className="media-fact">
              <ExternalLinkBlock
                mediaType="artist"
                mbid={data.id}
                serviceUrl={data.mediaInfo?.serviceUrl}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="extra-bottom-space relative" />
    </div>
  );
};

export default ArtistDetails;
