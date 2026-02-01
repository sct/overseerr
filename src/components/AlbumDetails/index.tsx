import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import RequestButton from '@app/components/RequestButton';
import StatusBadge from '@app/components/StatusBadge';
import Tag from '@app/components/Common/Tag';
import ExternalLinkBlock from '@app/components/ExternalLinkBlock';
import ManageSlideOver from '@app/components/ManageSlideOver';
import useSettings from '@app/hooks/useSettings';
import { Permission, useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import Error from '@app/pages/_error';
import { refreshIntervalHelper } from '@app/utils/refreshIntervalHelper';
import { CogIcon } from '@heroicons/react/24/outline';
import type Media from '@server/entity/Media';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  overview: 'Overview',
  overviewunavailable: 'Overview unavailable.',
  releaseDate: 'Release Date',
  primaryType: 'Type',
  artist: 'Artist',
  managealbum: 'Manage Album',
});

interface AlbumDetails {
  id: string;
  title: string;
  primaryType?: string;
  secondaryTypes?: string[];
  firstReleaseDate?: string;
  disambiguation?: string;
  artistCredit?: Array<{
    artist: { id: string; name: string };
    name?: string;
  }>;
  releases?: Array<{
    id: string;
    title: string;
    date?: string;
    country?: string;
  }>;
  tags?: Array<{ name: string; count: number }>;
  mediaInfo?: Media;
}

const AlbumDetails = () => {
  const settings = useSettings();
  const { user, hasPermission } = useUser();
  const router = useRouter();
  const intl = useIntl();
  const [showManager, setShowManager] = useState(
    router.query.manage == '1' ? true : false
  );

  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<AlbumDetails>(`/api/v1/music/album/${router.query.mbid}`, {
    refreshInterval: (currentData) =>
      refreshIntervalHelper(
        {
          downloadStatus: currentData?.mediaInfo?.downloadStatus,
          downloadStatus4k: undefined,
        },
        15000
      ),
  });

  useEffect(() => {
    setShowManager(router.query.manage == '1' ? true : false);
  }, [router.query.manage]);

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <Error statusCode={404} />;
  }

  const artistName =
    data.artistCredit?.[0]?.name ||
    data.artistCredit?.[0]?.artist?.name ||
    '';

  return (
    <div
      className="media-page"
      style={{
        height: 493,
      }}
    >
      <PageTitle title={data.title} />
      <ManageSlideOver
        data={data}
        mediaType="album"
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
      <div className="media-header">
        <div className="media-poster">
          <CachedImage
            src="/images/overseerr_poster_not_found.png"
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
              title={data.title}
              inProgress={(data.mediaInfo?.downloadStatus ?? []).length > 0}
              tmdbId={undefined}
              mediaType="album"
              serviceUrl={data.mediaInfo?.serviceUrl}
            />
          </div>
          <h1 data-testid="media-title">
            {data.title}
            {data.disambiguation && (
              <span className="media-year"> ({data.disambiguation})</span>
            )}
          </h1>
          {artistName && (
            <span className="media-attributes">
              <span>{intl.formatMessage(messages.artist)}: {artistName}</span>
            </span>
          )}
        </div>
        <div className="media-actions">
          <RequestButton
            mediaType="album"
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
      <div className="media-overview">
        <div className="media-overview-left">
          <h2>{intl.formatMessage(messages.overview)}</h2>
          <p>{intl.formatMessage(messages.overviewunavailable)}</p>
          {data.tags && data.tags.length > 0 && (
            <div className="mt-6">
              {data.tags.map((tag) => (
                <span key={`tag-${tag.name}`} className="mb-2 mr-2 inline-flex last:mr-0">
                  <Tag>{tag.name}</Tag>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="media-overview-right">
          <div className="media-facts">
            {data.firstReleaseDate && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.releaseDate)}</span>
                <span className="media-fact-value">{data.firstReleaseDate}</span>
              </div>
            )}
            {data.primaryType && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.primaryType)}</span>
                <span className="media-fact-value">{data.primaryType}</span>
              </div>
            )}
            {data.secondaryTypes && data.secondaryTypes.length > 0 && (
              <div className="media-fact">
                <span>Secondary Types</span>
                <span className="media-fact-value">
                  {data.secondaryTypes.join(', ')}
                </span>
              </div>
            )}
            {artistName && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.artist)}</span>
                <span className="media-fact-value">{artistName}</span>
              </div>
            )}
            <div className="media-fact">
              <ExternalLinkBlock
                mediaType="album"
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

export default AlbumDetails;
