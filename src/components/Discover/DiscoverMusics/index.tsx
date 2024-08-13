import Header from '@app/components/Common/Header';
import ListView from '@app/components/Common/ListView';
import PageTitle from '@app/components/Common/PageTitle';
import Error from '@app/pages/_error';
import { mbArtistType } from '@server/api/musicbrainz/interfaces';
import type Media from '@server/entity/Media';
import type { MediaResultsResponse } from '@server/interfaces/api/mediaInterfaces';
import type { ArtistResult } from '@server/models/Search';
import { useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  discovermusics: {
    defaultMessage: 'Your Downloaded Artists',
    id: 'discover.downloadedmusics',
  },
});

const mediaResultsToArtistResults = (results: Media[]): ArtistResult[] => {
  return results.map((media) => ({
    id: media.mbId ?? '',
    name: media.title ?? '...',
    type: mbArtistType.OTHER,
    mediaType: 'artist',
    mediaInfo: media,
    releases: [],
    tags: [],
  }));
};

const DiscoverMusics = () => {
  const intl = useIntl();

  const [artists, setArtists] = useState<ArtistResult[]>([]);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isReachingEnd, setIsReachingEnd] = useState(false);

  const isEmpty = useMemo(() => artists.length === 0, [artists]);

  const title = intl.formatMessage(messages.discovermusics);

  const fetchMore = () => {
    setIsLoadingMore(true);
    fetch(
      '/api/v1/media?filter=available&type=artist&sort=mediaAdded&skip=' +
        artists.length
    )
      .then((res) => res.json())
      .then((data) => {
        const results = mediaResultsToArtistResults(data.results);
        if (results.length === 0) {
          setIsReachingEnd(true);
        } else {
          setArtists((prev) => [...prev, ...results]);
        }
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
  };

  const { error } = useSWR<MediaResultsResponse>(
    '/api/v1/media?filter=available&type=artist&sort=mediaAdded',
    {
      onSuccess: (data) => {
        const results = mediaResultsToArtistResults(data.results);
        setArtists(results);
        setIsLoadingInitialData(false);
      },
    }
  );

  if (error) {
    return <Error statusCode={500} />;
  }

  return (
    <>
      <PageTitle title={title} />
      <div className="mb-4 flex flex-col justify-between lg:flex-row lg:items-end">
        <Header>{title}</Header>
      </div>
      <ListView
        items={artists}
        isEmpty={isEmpty}
        isReachingEnd={isReachingEnd}
        isLoading={
          isLoadingInitialData || (isLoadingMore && (artists?.length ?? 0) > 0)
        }
        onScrollBottom={fetchMore}
      />
    </>
  );
};

export default DiscoverMusics;
