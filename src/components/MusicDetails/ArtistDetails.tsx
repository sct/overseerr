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
import type {
  ArtistResult,
  ReleaseGroupResult,
  ReleaseResult,
} from '@server/models/Search';
import 'country-flag-icons/3x2/flags.css';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { defineMessage, defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  overview: 'Overview',
  playonplex: 'Play on Plex',
  reportissue: 'Report an Issue',
  releases: 'Releases',
});

const categoriesMessages = {
  Album: defineMessage({ id: 'Albums', defaultMessage: 'Albums' }),
  Single: defineMessage({ id: 'Singles', defaultMessage: 'Singles' }),
  EP: defineMessage({ id: 'EPs', defaultMessage: 'EPs' }),
  Other: defineMessage({ id: 'Other', defaultMessage: 'Other' }),
};

interface ArtistDetailsProp {
  artist: ArtistResult;
}

const ArtistDetails = ({ artist }: ArtistDetailsProp) => {
  const { hasPermission } = useUser();
  const router = useRouter();
  const intl = useIntl();
  const [showIssueModal, setShowIssueModal] = useState(false);

  const categorizeRG = (res: ReleaseGroupResult[]) =>
    res.reduce((group: { [key: string]: ReleaseGroupResult[] }, item) => {
      if (!group[item.type]) {
        group[item.type] = [item];
      } else {
        group[item.type].push(item);
      }
      return group;
    }, {});

  const categorizeR = (res: ReleaseResult[]) =>
    res.reduce((group: { [key: string]: ReleaseResult[] }, item) => {
      item.releaseGroupType = item.releaseGroupType ?? 'Other';
      if (!group[item.releaseGroupType]) {
        group[item.releaseGroupType] = [item];
      } else {
        group[item.releaseGroupType].push(item);
      }
      return group;
    }, {});

  const data = artist;

  const { plexUrl } = useDeepLinks({
    plexUrl: data?.mediaInfo?.plexUrl,
    iOSPlexUrl: data?.mediaInfo?.iOSPlexUrl,
  });

  const mediaLinks: PlayButtonLink[] = [];

  if (
    plexUrl &&
    hasPermission([Permission.REQUEST, Permission.REQUEST_MUSIC], {
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

  const mainDateDisplay: string =
    data.beginDate && data.endDate
      ? `${cleanDate(data.beginDate)} - ${cleanDate(data.endDate)}`
      : cleanDate(data.beginDate);

  /*
  const releaseGroups: ReleaseGroupResult[] = data.releaseGroups;

  const categorizedReleaseGroupsType = categorizeRG(releaseGroups);

  const [categoriesRG, setCategoriesRG] = useState(
    categorizedReleaseGroupsType ?? {}
  );
  */

  const releases: ReleaseResult[] = data.releases;

  const categorizedReleasesType = categorizeR(releases);

  const [categoriesR, setCategoriesR] = useState(categorizedReleasesType ?? {});

  const customMerge = (
    oldData: { [key: string]: unknown[] },
    newData: { [key: string]: unknown[] }
  ) => {
    for (const key in newData) {
      if (oldData[key]) {
        oldData[key].push(...newData[key]);
      } else {
        oldData[key] = newData[key];
      }
    }
    return oldData;
  };

  const [currentOffset, setCurrentOffset] = useState(0);

  const [isLoading, setLoading] = useState(false);

  const getMore = useCallback(() => {
    if (isLoading) {
      return;
    }
    setLoading(true);
    fetch(
      `/api/v1/music/artist/${router.query.mbId}?full=true&offset=${
        currentOffset + 25
      }`
    )
      .then((res) => res.json())
      .then((res) => {
        if (res) {
          /*
          const rg = categorizeRG(res.releaseGroups ?? []);
          setCategoriesRG(
            (prev) =>
              customMerge(prev, rg) as { [key: string]: ReleaseGroupResult[] }
          );
          */
          const r = categorizeR(res.releases ?? []);
          setCategoriesR(
            (prev) => customMerge(prev, r) as { [key: string]: ReleaseResult[] }
          );
          setCurrentOffset(currentOffset + 25);
          setLoading(false);
        }
      });
  }, [currentOffset, isLoading, router.query.mbId]);

  useEffect(() => {
    const handleScroll = () => {
      const bottom =
        document.body.scrollHeight - window.scrollY - window.outerHeight <= 1;
      if (bottom) {
        getMore();
      }
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [getMore]);

  if (!data) {
    return <Error statusCode={404} />;
  }

  const title = data.name;

  const tags: string[] = data.tags ?? [];

  return (
    <div
      className="media-page"
      style={{
        height: 493,
      }}
      key={data.id}
    >
      <div className="media-page-bg-image">
        <CachedImage
          alt=""
          src={data.fanartPath ?? ''}
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
      <PageTitle title={title} />
      <IssueModal
        onCancel={() => setShowIssueModal(false)}
        show={showIssueModal}
        mediaType="music"
        mbId={data.id}
        secondaryType={SecondaryType.ARTIST}
      />
      <div className="media-header">
        <div className="media-poster">
          <CachedImage
            src={data.posterPath ?? ''}
            alt={title + ' poster'}
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
              secondaryType={SecondaryType.ARTIST}
            />
          </div>
          <h1 data-testid="media-title">
            {title}{' '}
            {mainDateDisplay !== '' && (
              <span className="media-year">({mainDateDisplay})</span>
            )}
          </h1>
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
            secondaryType={SecondaryType.ARTIST}
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
      {Object.entries(categoriesR).map(([type, category]) => (
        <div key={type}>
          <div className="slider-header">
            <div className="slider-title">
              <span>
                {intl.formatMessage(
                  categoriesMessages[type as keyof typeof categoriesMessages]
                )}
              </span>
            </div>
          </div>
          <ListView
            isLoading={false}
            jsxItems={category.map((item) => {
              return (
                <FetchedDataTitleCard
                  key={`media-slider-item-${item.id}`}
                  data={item}
                />
              );
            })}
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onScrollBottom={() => {}}
          />
        </div>
      ))}
    </div>
  );
};

export default ArtistDetails;
