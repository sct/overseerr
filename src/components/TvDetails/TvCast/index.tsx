import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useContext } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
import type { TvDetails } from '../../../../server/models/Tv';
import { LanguageContext } from '../../../context/LanguageContext';
import Error from '../../../pages/_error';
import Header from '../../Common/Header';
import LoadingSpinner from '../../Common/LoadingSpinner';
import PersonCard from '../../PersonCard';

const messages = defineMessages({
  fullseriescast: 'Full Series Cast',
});

const TvCast: React.FC = () => {
  const router = useRouter();
  const intl = useIntl();
  const { locale } = useContext(LanguageContext);
  const { data, error } = useSWR<TvDetails>(
    `/api/v1/tv/${router.query.tvId}?language=${locale}`
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <Error statusCode={404} />;
  }

  return (
    <>
      <div className="mt-1 mb-5">
        <Header
          subtext={
            <Link href={`/tv/${data.id}`}>
              <a className="hover:underline">{data.name}</a>
            </Link>
          }
        >
          {intl.formatMessage(messages.fullseriescast)}
        </Header>
      </div>
      <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8">
        {data?.credits.cast.map((person) => {
          return (
            <li
              key={person.id}
              className="flex flex-col items-center col-span-1 text-center"
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

export default TvCast;
