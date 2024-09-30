import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import ListView from '@app/components/Common/ListView';
import PageTitle from '@app/components/Common/PageTitle';
import type { PlayButtonLink } from '@app/components/Common/PlayButton';
import PlayButton from '@app/components/Common/PlayButton';
import Tooltip from '@app/components/Common/Tooltip';
import IssueModal from '@app/components/IssueModal';
import RequestButton from '@app/components/RequestButton';
import StatusBadge from '@app/components/StatusBadge';
import FetchedDataTitleCard from '@app/components/TitleCard/FetchedDataTitleCard';
import useDeepLinks from '@app/hooks/useDeepLinks';
import { Permission, useUser } from '@app/hooks/useUser';
import Error from '@app/pages/_error';
import { ExclamationTriangleIcon, PlayIcon } from '@heroicons/react/24/outline';
import { MediaStatus, SecondaryType } from '@server/constants/media';
import type { ReleaseGroupResult } from '@server/models/Search';
import 'country-flag-icons/3x2/flags.css';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  overview: 'Overview',
  recommendations: 'Recommendations',
  playonplex: 'Play on Plex',
  markavailable: 'Mark as Available',
  showmore: 'Show More',
  showless: 'Show Less',
  reportissue: 'Report an Issue',
  releases: 'Releases',
  albums: 'Albums',
  singles: 'Singles',
  eps: 'EPs',
  broadcasts: 'Broadcasts',
  others: 'Others',
  feats: 'Featured In',
});

interface ReleaseGroupDetailsProp {
  releaseGroup: ReleaseGroupResult;
}

const ReleaseGroupDetails = ({ releaseGroup }: ReleaseGroupDetailsProp) => {
  const { hasPermission } = useUser();
  const intl = useIntl();
  const [showIssueModal, setShowIssueModal] = useState(false);

  const data = releaseGroup;

  const { plexUrl } = useDeepLinks({
    plexUrl: data?.mediaInfo?.plexUrl,
    iOSPlexUrl: data?.mediaInfo?.iOSPlexUrl,
  });

  const mediaLinks: PlayButtonLink[] = [];

  if (
    plexUrl &&
    hasPermission([Permission.REQUEST, Permission.REQUEST_MOVIE], {
      type: 'or',
    })
  ) {
    mediaLinks.push({
      text: intl.formatMessage(messages.playonplex),
      url: plexUrl,
      svg: <PlayIcon />,
    });
  }

  const releases = data.releases;

  if (!data) {
    return <Error statusCode={404} />;
  }

  /*
  const cleanDate = (date: Date | string | undefined) => {
    date = date ?? '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatedDate = cleanDate(data.firstReleaseDate ?? '');
  */

  const title = data.title;

  const tags: string[] = data.tags ?? [];

  return (
    <div
      className="media-page"
      style={{
        height: 493,
      }}
    >
      <div className="media-page-bg-image">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(17, 24, 39, 0.47) 0%, rgba(17, 24, 39, 1) 100%)',
          }}
        />
      </div>
      <PageTitle title={title} />
      <IssueModal
        onCancel={() => setShowIssueModal(false)}
        show={showIssueModal}
        mediaType="music"
        mbId={data.id}
        secondaryType={SecondaryType.RELEASE_GROUP}
      />
      <div className="media-header">
        <div className="media-poster">
          <CachedImage
            src={data.posterPath ?? ''}
            alt={title + ' album cover'}
            layout="responsive"
            width={600}
            height={600}
            priority
          />
        </div>
        <div className="media-title">
          <div className="media-status">
            <StatusBadge
              status={data.mediaInfo?.status}
              downloadItem={data.mediaInfo?.downloadStatus}
              title={title}
              inProgress={(data.mediaInfo?.downloadStatus ?? []).length > 0}
              tmdbId={data.mediaInfo?.tmdbId}
              mediaType="music"
              plexUrl={plexUrl}
              serviceUrl={data.mediaInfo?.serviceUrl}
              secondaryType={SecondaryType.RELEASE_GROUP}
            />
          </div>
          <h1 data-testid="media-title">{title}</h1>
          <h2 data-testid="media-subtitle">{data.type}</h2>
          <span className="media-attributes">
            {tags.map((t, k) => (
              <span key={k}>{t}</span>
            ))}
          </span>
        </div>
        <div className="media-actions">
          <PlayButton links={mediaLinks} />
          <RequestButton
            mediaType="music"
            media={data.mediaInfo}
            mbId={data.id}
            secondaryType={SecondaryType.RELEASE_GROUP}
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onUpdate={() => {}}
          />
          {data.mediaInfo?.status === MediaStatus.AVAILABLE &&
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
        </div>
      </div>
      {releases?.length > 0 && (
        <>
          <div className="slider-header">
            <div className="slider-title">
              <span>{intl.formatMessage(messages.releases)}</span>
            </div>
          </div>
          <ListView
            isLoading={false}
            jsxItems={releases.map((item) => (
              <FetchedDataTitleCard
                key={`media-slider-item-${item.id}`}
                data={item}
              />
            ))}
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onScrollBottom={() => {}}
          />
        </>
      )}
    </div>
  );
};

export default ReleaseGroupDetails;
