import { useRouter } from 'next/router';
import React, { useContext } from 'react';
import useSWR from 'swr';
import type { PersonDetail } from '../../../server/models/Person';
import type { PersonCombinedCreditsResponse } from '../../../server/interfaces/api/personInterfaces';
import Error from '../../pages/_error';
import LoadingSpinner from '../Common/LoadingSpinner';
import TitleCard from '../TitleCard';
import { defineMessages, useIntl } from 'react-intl';
import { LanguageContext } from '../../context/LanguageContext';

const messages = defineMessages({
  appearsin: 'Appears in',
  ascharacter: 'as {character}',
  nobiography: 'No biography available.',
});

const PersonDetails: React.FC = () => {
  const intl = useIntl();
  const { locale } = useContext(LanguageContext);
  const router = useRouter();
  const { data, error } = useSWR<PersonDetail>(
    `/api/v1/person/${router.query.personId}`
  );

  const {
    data: combinedCredits,
    error: errorCombinedCredits,
  } = useSWR<PersonCombinedCreditsResponse>(
    `/api/v1/person/${router.query.personId}/combined_credits?language=${locale}`
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <Error statusCode={404} />;
  }

  const sortedCast = combinedCredits?.cast.sort((a, b) => {
    const aDate =
      a.mediaType === 'movie'
        ? a.releaseDate?.slice(0, 4) ?? 0
        : a.firstAirDate?.slice(0, 4) ?? 0;
    const bDate =
      b.mediaType === 'movie'
        ? b.releaseDate?.slice(0, 4) ?? 0
        : b.firstAirDate?.slice(0, 4) ?? 0;
    if (aDate > bDate) {
      return -1;
    }
    return 1;
  });

  const isLoading = !combinedCredits && !errorCombinedCredits;

  return (
    <>
      <div className="flex mt-8 mb-8 flex-col md:flex-row items-center md:items-start">
        {data.profilePath && (
          <div
            style={{
              backgroundImage: `url(https://image.tmdb.org/t/p/w600_and_h900_bestv2${data.profilePath})`,
            }}
            className="rounded-full w-36 h-36 md:w-44 md:h-44 bg-cover bg-center mb-6 md:mb-0 mr-0 md:mr-6 flex-shrink-0"
          />
        )}
        <div className="text-gray-300 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl text-white mb-4">{data.name}</h1>
          <div>
            {data.biography
              ? data.biography
              : intl.formatMessage(messages.nobiography)}
          </div>
        </div>
      </div>
      <div className="md:flex md:items-center md:justify-between mb-4 mt-6">
        <div className="flex-1 min-w-0">
          <div className="inline-flex text-xl leading-7 text-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate items-center">
            <span>{intl.formatMessage(messages.appearsin)}</span>
          </div>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8">
        {sortedCast?.map((media) => {
          return (
            <li
              key={`list-cast-item-${media.id}`}
              className="col-span-1 flex flex-col text-center items-center"
            >
              <TitleCard
                id={media.id}
                title={media.mediaType === 'movie' ? media.title : media.name}
                userScore={media.voteAverage}
                year={
                  media.mediaType === 'movie'
                    ? media.releaseDate
                    : media.firstAirDate
                }
                image={media.posterPath}
                summary={media.overview}
                mediaType={media.mediaType as 'movie' | 'tv'}
                status={media.mediaInfo?.status}
                canExpand
              />
              {media.character && (
                <div className="mt-2 text-gray-300 text-xs truncate w-36 sm:w-36 md:w-44 text-center">
                  {intl.formatMessage(messages.ascharacter, {
                    character: media.character,
                  })}
                </div>
              )}
            </li>
          );
        })}
        {isLoading &&
          [...Array(20)].map((_item, i) => (
            <li
              key={`placeholder-${i}`}
              className="col-span-1 flex flex-col text-center items-center"
            >
              <TitleCard.Placeholder canExpand />
            </li>
          ))}
      </ul>
    </>
  );
};

export default PersonDetails;
