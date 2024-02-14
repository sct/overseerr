import Slider from '@app/components/Slider';
import MusicTitleCard from '@app/components/TitleCard/MusicTitleCard';
import TmdbTitleCard from '@app/components/TitleCard/TmdbTitleCard';
import { Permission, useUser } from '@app/hooks/useUser';
import type { SecondaryType } from '@server/constants/media';
import type { MediaResultsResponse } from '@server/interfaces/api/mediaInterfaces';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  recentlyAdded: 'Recently Added',
  recentlyAddedMusic: 'Recently Added Music',
});

const RecentlyAddedSlider = ({
  type = 'all',
}: {
  type?: 'all' | 'movie' | 'tv' | 'music' | 'artist' | 'release';
}) => {
  const intl = useIntl();
  const { hasPermission } = useUser();
  type = type ?? 'all';
  const { data: media, error: mediaError } = useSWR<MediaResultsResponse>(
    `/api/v1/media?filter=allavailable&take=20&sort=mediaAdded&type=${type}`,
    { revalidateOnMount: true }
  );

  if (
    (media && !media.results.length && !mediaError) ||
    !hasPermission([Permission.MANAGE_REQUESTS, Permission.RECENT_VIEW], {
      type: 'or',
    })
  ) {
    return null;
  }

  const videoMedias = (media?.results ?? []).filter((item) =>
    ['movie', 'tv'].includes(item.mediaType)
  );
  const musicMedias = (media?.results ?? []).filter(
    (item) => !['movie', 'tv'].includes(item.mediaType)
  );
  return (
    <>
      {videoMedias.length > 0 && (
        <>
          <div className="slider-header">
            <div className="slider-title">
              <span>{intl.formatMessage(messages.recentlyAdded)}</span>
            </div>
          </div>
          <Slider
            sliderKey="media"
            isLoading={!media}
            items={videoMedias.map((item) => (
              <TmdbTitleCard
                key={`media-slider-item-${item.id}`}
                id={item.id}
                tmdbId={item.tmdbId as number}
                tvdbId={item.tvdbId}
                type={item.mediaType as 'movie' | 'tv'}
              />
            ))}
          />
        </>
      )}
      {musicMedias.length > 0 && (
        <>
          <div className="slider-header">
            <div className="slider-title">
              <span>{intl.formatMessage(messages.recentlyAddedMusic)}</span>
            </div>
          </div>

          <Slider
            sliderKey="media"
            isLoading={!media}
            items={musicMedias.map((item) => (
              <MusicTitleCard
                key={`media-slider-item-${item.id}`}
                id={item.id}
                mbId={item.mbId ?? ''}
                type={item.secondaryType as SecondaryType}
                displayType={item.secondaryType as SecondaryType}
              />
            ))}
          />
        </>
      )}
    </>
  );
};

export default RecentlyAddedSlider;
