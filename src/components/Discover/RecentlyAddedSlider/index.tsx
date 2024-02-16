import Slider from '@app/components/Slider';
import TitleCard from '@app/components/TitleCard';
import TmdbTitleCard from '@app/components/TitleCard/TmdbTitleCard';
import { Permission, useUser } from '@app/hooks/useUser';
import type { MediaResultsResponse } from '@server/interfaces/api/mediaInterfaces';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
//import MusicBrainz from '@server/api/musicbrainz';


const messages = defineMessages({
  recentlyAdded: 'Recently Added',
  recentlyAddedMusic: 'Recently Added Music',
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

  const videoMedias = (media?.results ?? []).filter((item) => ["movie", "tv"].includes(item.mediaType))
  const musicMedias = (media?.results ?? []).filter((item) => !["movie", "tv"].includes(item.mediaType))

  //const musicBrainz = new MusicBrainz();
  //const artistNames = musicMedias.map(async (item) => {return item.mbId ? (await musicBrainz.getArtist(item.mbId)).name: "Unknown"});

  const musicItems = musicMedias.map((item) => (
    <TitleCard
      key={`media-slider-item-${item.id}`}
      id={item.id}
      title={"Unknown"}
      mediaType={item.mediaType as 'music'}
    />
  ));

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
      <div className="slider-header">
        <div className="slider-title">
          <span>{intl.formatMessage(messages.recentlyAddedMusic)}</span>
        </div>
      </div>

      <Slider
        sliderKey="media"
        isLoading={!media}
        items={musicItems}
      />
    </>
  );
};

export default RecentlyAddedSlider;
