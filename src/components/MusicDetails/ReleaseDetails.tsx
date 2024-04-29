import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import List from '@app/components/Common/List';
import PageTitle from '@app/components/Common/PageTitle';
import type { PlayButtonLink } from '@app/components/Common/PlayButton';
import PlayButton from '@app/components/Common/PlayButton';
import Tag from '@app/components/Common/Tag';
import Tooltip from '@app/components/Common/Tooltip';
import IssueModal from '@app/components/IssueModal';
import RequestButton from '@app/components/RequestButton';
import StatusBadge from '@app/components/StatusBadge';
import useDeepLinks from '@app/hooks/useDeepLinks';
import { Permission, useUser } from '@app/hooks/useUser';
import Error from '@app/pages/_error';
import { ExclamationTriangleIcon, PlayIcon } from '@heroicons/react/24/outline';
import { MediaStatus, SecondaryType } from '@server/constants/media';
import type { RecordingResult, ReleaseResult } from '@server/models/Search';
import 'country-flag-icons/3x2/flags.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  originaltitle: 'Original Title',
  overview: 'Overview',
  recommendations: 'Recommendations',
  playonplex: 'Play on Plex',
  markavailable: 'Mark as Available',
  showmore: 'Show More',
  showless: 'Show Less',
  digitalrelease: 'Digital Release',
  physicalrelease: 'Physical Release',
  reportissue: 'Report an Issue',
  managemusic: 'Manage Music',
  releases: 'Releases',
  albums: 'Albums',
  singles: 'Singles',
  eps: 'EPs',
  broadcasts: 'Broadcasts',
  others: 'Others',
  feats: 'Featured In',
  tracks: 'Tracks',
});

interface ReleaseDetailsProp {
  release: ReleaseResult;
}

const ReleaseDetails = ({ release }: ReleaseDetailsProp) => {
  const { hasPermission } = useUser();
  const router = useRouter();
  const intl = useIntl();
  const [showIssueModal, setShowIssueModal] = useState(false);

  const { data: fetched } = useSWR<ReleaseResult>(
    `/api/v1/music/release/${router.query.mbId}?full=true`
  );

  const data = fetched ?? release;

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

  const cleanDate = (date: Date | string | undefined) => {
    date = date ?? '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const mainDateDisplay: string = cleanDate(data.date);

  const tracks: RecordingResult[] = data.tracks ?? [];

  const lengthToTime = (length: number) => {
    length /= 1000;
    const minutes = Math.floor(length / 60);
    const seconds = length - minutes * 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds.toFixed(0)}`;
  };

  if (!data) {
    return <Error statusCode={404} />;
  }

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
        secondaryType={SecondaryType.RELEASE}
      />
      <div className="media-header">
        <div className="media-poster">
          <CachedImage
            src={data.posterPath ?? ''}
            alt=""
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
              secondaryType={SecondaryType.RELEASE}
            />
          </div>
          <h1 data-testid="media-title">
            {title}{' '}
            {mainDateDisplay !== '' && (
              <span className="media-year">({mainDateDisplay})</span>
            )}
          </h1>
          <span className="media-attributes">
            By&nbsp;
            {data.artist.map((artist, index) => (
              <div key={`artist-${index}`}>
                {' '}
                <Link
                  href={`/music/artist/${artist.id}`}
                  className="hover:underline"
                >
                  {artist.name}
                </Link>
                {index < data.artist.length - 1 ? ', ' : ''}
              </div>
            ))}
          </span>
        </div>
        <div className="media-actions">
          <PlayButton links={mediaLinks} />
          <RequestButton
            mediaType="music"
            media={data.mediaInfo}
            mbId={data.id}
            secondaryType={SecondaryType.RELEASE}
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
      <div>
        {tags.length > 0 && (
          <div className="mt-6">
            {tags.map((keyword, idx) => (
              <Link
                href={`/discover/music?keywords=${keyword}`}
                key={`keyword-id-${idx}`}
                className="mb-2 mr-2 inline-flex last:mr-0"
              >
                <Tag>{keyword}</Tag>
              </Link>
            ))}
          </div>
        )}
        <List title={intl.formatMessage(messages.tracks)}>
          {tracks.map((track, index) => (
            <div key={index}>
              <div className="max-w-6xl py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="block text-sm font-bold text-gray-400">
                  {track.title}
                </dt>
                <dd className="flex text-sm text-white sm:col-span-2 sm:mt-0">
                  <span className="flex-grow">
                    {lengthToTime(track.length)}
                  </span>
                </dd>
                <dd>
                  <span className="flex-grow">
                    {track.artist.map((artist, index) => (
                      <span key={index}>{artist.name}</span>
                    ))}
                  </span>
                </dd>
              </div>
            </div>
          ))}
        </List>
      </div>
    </div>
  );
};

export default ReleaseDetails;
