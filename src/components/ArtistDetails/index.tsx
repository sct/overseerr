import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import RequestButton from '@app/components/RequestButton';
import StatusBadge from '@app/components/StatusBadge';
import Tag from '@app/components/Common/Tag';
import ExternalLinkBlock from '@app/components/ExternalLinkBlock';
import ManageSlideOver from '@app/components/ManageSlideOver';
import AlbumTitleCard from '@app/components/TitleCard/AlbumTitleCard';
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
  discography: 'Discography',
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
  tags?: Array<{ name: string; count: number }>;
  releaseGroups?: Array<{
    id: string;
    title: string;
    'primary-type'?: string;
    'first-release-date'?: string;
    'artist-credit'?: Array<{
      artist: { id: string; name: string };
      name?: string;
    }>;
  }>;
  mediaInfo?: Media;
}

const ArtistDetails = () => {
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

  useEffect(() => {
    setShowManager(router.query.manage == '1' ? true : false);
  }, [router.query.manage]);

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <Error statusCode={404} />;
  }

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
          {data.releaseGroups && data.releaseGroups.length > 0 && (
            <>
              <h2 className="py-4">{intl.formatMessage(messages.discography)}</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {(data.releaseGroups || [])
                  // keep discography sane: focus on albums and avoid huge lists
                  .filter((rg) => !rg['primary-type'] || rg['primary-type'] === 'Album')
                  .slice(0, 12)
                  .map((rg) => (
                    <AlbumTitleCard key={`album-${rg.id}`} id={rg.id} mbid={rg.id} />
                  ))}
              </div>
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
                    <span className="media-fact-value">{data.lifeSpan.begin}</span>
                  </div>
                )}
                {data.lifeSpan.end && (
                  <div className="media-fact">
                    <span>Ended</span>
                    <span className="media-fact-value">{data.lifeSpan.end}</span>
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
