import Slider from '@app/components/Slider';
import TmdbTitleCard from '@app/components/TitleCard/TmdbTitleCard';
import ArtistTitleCard from '@app/components/TitleCard/ArtistTitleCard';
import AlbumTitleCard from '@app/components/TitleCard/AlbumTitleCard';
import { Permission, useUser } from '@app/hooks/useUser';
import type { MediaResultsResponse } from '@server/interfaces/api/mediaInterfaces';
import { MediaType } from '@server/constants/media';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  recentlyAdded: 'Recently Added',
});

const RecentlyAddedSlider = () => {
  const intl = useIntl();
  const { hasPermission } = useUser();
  const { data: media, error: mediaError } = useSWR<MediaResultsResponse>(
    '/api/v1/media?filter=allavailable&take=20&sort=mediaAdded',
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

  return (
    <>
      <div className="slider-header">
        <div className="slider-title">
          <span>{intl.formatMessage(messages.recentlyAdded)}</span>
        </div>
      </div>
      <Slider
        sliderKey="media"
        isLoading={!media}
        items={(media?.results ?? []).map((item) => {
          // Handle music types
          if (item.mediaType === MediaType.ARTIST && item.musicBrainzId) {
            return (
              <ArtistTitleCard
                key={`media-slider-item-${item.id}`}
                id={item.musicBrainzId}
                mbid={item.musicBrainzId}
              />
            );
          }
          if (item.mediaType === MediaType.ALBUM && item.musicBrainzId) {
            return (
              <AlbumTitleCard
                key={`media-slider-item-${item.id}`}
                id={item.musicBrainzId}
                mbid={item.musicBrainzId}
              />
            );
          }
          // Handle movie/TV types
          return (
            <TmdbTitleCard
              key={`media-slider-item-${item.id}`}
              id={item.id}
              tmdbId={item.tmdbId || 0}
              tvdbId={item.tvdbId}
              type={item.mediaType === MediaType.MOVIE ? 'movie' : 'tv'}
            />
          );
        })}
      />
    </>
  );
};

export default RecentlyAddedSlider;
