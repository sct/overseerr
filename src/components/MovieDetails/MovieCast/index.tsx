import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useContext } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
import { MovieDetails } from '../../../../server/models/Movie';
import { LanguageContext } from '../../../context/LanguageContext';
import Error from '../../../pages/_error';
import Header from '../../Common/Header';
import LoadingSpinner from '../../Common/LoadingSpinner';
import PersonCard from '../../PersonCard';

const messages = defineMessages({
  fullcast: 'Full Cast',
});

const MovieCast: React.FC = () => {
  const router = useRouter();
  const intl = useIntl();
  const { locale } = useContext(LanguageContext);
  const { data, error } = useSWR<MovieDetails>(
    `/api/v1/movie/${router.query.movieId}?language=${locale}`
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <Error statusCode={404} />;
  }

  return (
    <>
      <Header
        subtext={
          <Link href={`/movie/${data.id}`}>
            <a className="hover:underline">{data.title}</a>
          </Link>
        }
      >
        {intl.formatMessage(messages.fullcast)}
      </Header>
      <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8">
        {data?.credits.cast.map((person) => {
          return (
            <li
              key={person.id}
              className="col-span-1 flex flex-col text-center items-center"
            >
              <PersonCard
                name={person.name}
                personId={person.id}
                subName={person.character}
                profilePath={person.profilePath}
                canExpand
              />
            </li>
          );
        })}
      </ul>
    </>
  );
};

export default MovieCast;
