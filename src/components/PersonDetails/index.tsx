import { useRouter } from 'next/router';
import React, { useContext, useState } from 'react';
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
  crewmember: 'Crew Member',
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
  const [showBio, setShowBio] = useState(false);

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

  const sortedCrew = combinedCredits?.crew.sort((a, b) => {
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
      <div className="flex flex-col items-center mt-8 mb-8 md:flex-row md:items-start">
        {data.profilePath && (
          <div
            style={{
              backgroundImage: `url(https://image.tmdb.org/t/p/w600_and_h900_bestv2${data.profilePath})`,
            }}
            className="flex-shrink-0 mb-6 mr-0 bg-center bg-cover rounded-full w-36 h-36 md:w-44 md:h-44 md:mb-0 md:mr-6"
          />
        )}
        <div className="text-center text-gray-300 md:text-left">
          <h1 className="mb-4 text-3xl text-white md:text-4xl">{data.name}</h1>
          <div className="relative">
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
            <div
              className={`transition-max-height duration-300 ${
                showBio
                  ? 'overflow-visible extra-max-height'
                  : 'overflow-hidden max-h-44'
              }`}
              onClick={() => setShowBio((show) => !show)}
              role="button"
              tabIndex={-1}
            >
              <div className={showBio ? 'h-auto' : 'h-36'}>
                {data.biography
                  ? data.biography
                  : intl.formatMessage(messages.nobiography)}
              </div>
              {!showBio && (
                <div className="absolute bottom-0 left-0 right-0 w-full h-8 bg-gradient-to-t from-gray-900" />
              )}
            </div>
          </div>
        </div>
      </div>
      {(sortedCast ?? []).length > 0 && (
        <>
          <div className="mt-6 mb-4 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center text-xl leading-7 text-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate">
                <span>{intl.formatMessage(messages.appearsin)}</span>
              </div>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8">
            {sortedCast?.map((media, index) => {
              return (
                <li
                  key={`list-cast-item-${media.id}-${index}`}
                  className="flex flex-col items-center col-span-1 text-center"
                >
                  <TitleCard
                    id={media.id}
                    title={
                      media.mediaType === 'movie' ? media.title : media.name
                    }
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
                    <div className="mt-2 text-xs text-center text-gray-300 truncate w-36 sm:w-36 md:w-44">
                      {intl.formatMessage(messages.ascharacter, {
                        character: media.character,
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {(sortedCrew ?? []).length > 0 && (
        <>
          <div className="mt-6 mb-4 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center text-xl leading-7 text-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate">
                <span>{intl.formatMessage(messages.crewmember)}</span>
              </div>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8">
            {sortedCrew?.map((media, index) => {
              return (
                <li
                  key={`list-crew-item-${media.id}-${index}`}
                  className="flex flex-col items-center col-span-1 text-center"
                >
                  <TitleCard
                    id={media.id}
                    title={
                      media.mediaType === 'movie' ? media.title : media.name
                    }
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
                  {media.job && (
                    <div className="mt-2 text-xs text-center text-gray-300 truncate w-36 sm:w-36 md:w-44">
                      {media.job}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {isLoading && <LoadingSpinner />}
    </>
  );
};

export default PersonDetails;
