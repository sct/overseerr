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
import useSettings from '@app/hooks/useSettings';
import { Permission, useUser } from '@app/hooks/useUser';
import Error from '@app/pages/_error';
import { ExclamationTriangleIcon, PlayIcon } from '@heroicons/react/24/outline';
import { MediaStatus, SecondaryType } from '@server/constants/media';
import type {
  ArtistResult,
  RecordingResult,
  ReleaseGroupResult,
  ReleaseResult,
  WorkResult,
} from '@server/models/Search';
import 'country-flag-icons/3x2/flags.css';
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
});

interface MusicDetailsProps {
  type: SecondaryType;
  artist?: ArtistResult;
  releaseGroup?: ReleaseGroupResult;
  release?: ReleaseResult;
  recording?: RecordingResult;
  work?: WorkResult;
}

const MusicDetails = ({
  type,
  artist,
  releaseGroup,
  release,
  recording,
  work,
}: MusicDetailsProps) => {
  const settings = useSettings();
  const { hasPermission } = useUser();
  const router = useRouter();
  const intl = useIntl();
  const [showIssueModal, setShowIssueModal] = useState(false);

  const { data: fetched } = useSWR<
    | ArtistResult
    | ReleaseGroupResult
    | ReleaseResult
    | RecordingResult
    | WorkResult
  >(`/api/v1/music/${router.query.type}/${router.query.mbId}?full=true`);

  let to_explore = [],
    data;
  switch (type) {
    case SecondaryType.ARTIST:
      data = fetched ?? artist;
      to_explore = [
        SecondaryType.RELEASE_GROUP,
        SecondaryType.RELEASE,
        SecondaryType.RECORDING,
        SecondaryType.WORK,
      ];
      break;
    case SecondaryType.RELEASE_GROUP:
      data = fetched ?? releaseGroup;
      to_explore = [
        SecondaryType.RELEASE,
        SecondaryType.RECORDING,
        SecondaryType.WORK,
      ];
      break;
    case SecondaryType.RELEASE:
      data = fetched ?? release;
      to_explore = [SecondaryType.RECORDING, SecondaryType.ARTIST];
      break;
    case SecondaryType.RECORDING:
      data = fetched ?? recording;
      to_explore = [SecondaryType.ARTIST];
      break;
    case SecondaryType.WORK:
      data = fetched ?? work;
      to_explore = [SecondaryType.ARTIST];
      break;
  }

  const { plexUrl } = useDeepLinks({
    plexUrl: data?.mediaInfo?.plexUrl,
    iOSPlexUrl: data?.mediaInfo?.iOSPlexUrl,
  });

  if (!data) {
    return <Error statusCode={404} />;
  }

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

  const title =
    data.mediaType !== SecondaryType.ARTIST ? data.title : data.name;

  const mainDateDisplay: string =
    type === SecondaryType.ARTIST &&
    (data as ArtistResult).beginDate &&
    (data as ArtistResult).endDate
      ? `${(data as ArtistResult).beginDate} - ${
          (data as ArtistResult).endDate
        }`
      : type === SecondaryType.ARTIST && (data as ArtistResult).beginDate
      ? `${(data as ArtistResult).beginDate}`
      : type === SecondaryType.RELEASE && (data as ReleaseResult).date
      ? `${(data as ReleaseResult).date}`
      : type === SecondaryType.RECORDING &&
        (data as RecordingResult).firstReleased
      ? `${(data as RecordingResult).firstReleased}`
      : '';

  const releaseGroups: ReleaseGroupResult[] = to_explore.includes(
    SecondaryType.RELEASE_GROUP
  )
    ? (data as ArtistResult).releaseGroups
    : type === SecondaryType.RELEASE_GROUP
    ? [data as ReleaseGroupResult]
    : [];

  const categorizedReleaseGroupsType = releaseGroups.reduce(
    (group: { [key: string]: ReleaseGroupResult[] }, item) => {
      if (!group[item.type]) {
        group[item.type] = [];
      }
      group[item.type].push(item);
      return group;
    },
    {}
  );

  const albums = categorizedReleaseGroupsType['Album'] ?? [];
  const singles = categorizedReleaseGroupsType['Single'] ?? [];
  const eps = categorizedReleaseGroupsType['EP'] ?? [];
  const broadcasts = categorizedReleaseGroupsType['Broadcast'] ?? [];
  const others = categorizedReleaseGroupsType['Other'] ?? [];

  const tags: string[] = data.tags ?? [];

  return (
    <div
      className="media-page"
      style={{
        height: 493,
      }}
    >
      <div className="media-page-bg-image">
        {data.mediaType === SecondaryType.ARTIST && (
          <CachedImage
            alt=""
            src={(data as ArtistResult).fanartPath ?? ''}
            layout="fill"
            objectFit="cover"
            priority
          />
        )}
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
        secondaryType={type as SecondaryType}
      />
      <div className="media-header">
        <div className="media-poster">
          <CachedImage
            src={
              data.mediaType === SecondaryType.RELEASE ||
              data.mediaType === SecondaryType.RELEASE_GROUP ||
              data.mediaType === SecondaryType.ARTIST
                ? (data.posterPath as string)
                : ''
            }
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
              secondaryType={type}
            />
          </div>
          <h1 data-testid="media-title">
            {title}{' '}
            {mainDateDisplay !== '' && (
              <span className="media-year">({mainDateDisplay})</span>
            )}
          </h1>
          <span className="media-attributes">
            {tags.length > 0 &&
              tags
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
            mbId={data.id}
            secondaryType={type}
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onUpdate={() => {}}
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
      {albums?.length > 0 && (
        <>
          <div className="slider-header">
            <div className="slider-title">
              <span>{intl.formatMessage(messages.albums)}</span>
            </div>
          </div>
          <ListView
            isLoading={false}
            jsxItems={albums.map((item) => (
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
      {singles?.length > 0 && (
        <>
          <div className="slider-header">
            <div className="slider-title">
              <span>{intl.formatMessage(messages.singles)}</span>
            </div>
          </div>
          <ListView
            isLoading={false}
            jsxItems={singles.map((item) => (
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
      {eps?.length > 0 && (
        <>
          <div className="slider-header">
            <div className="slider-title">
              <span>{intl.formatMessage(messages.eps)}</span>
            </div>
          </div>
          <ListView
            isLoading={false}
            jsxItems={eps.map((item) => (
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
      {broadcasts?.length > 0 && (
        <>
          <div className="slider-header">
            <div className="slider-title">
              <span>{intl.formatMessage(messages.broadcasts)}</span>
            </div>
          </div>
          <ListView
            isLoading={false}
            jsxItems={broadcasts.map((item) => (
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
      {others?.length > 0 && (
        <>
          <div className="slider-header">
            <div className="slider-title">
              <span>{intl.formatMessage(messages.others)}</span>
            </div>
          </div>
          <ListView
            isLoading={false}
            jsxItems={others.map((item) => (
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

export default MusicDetails;
