import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
import type { TvDetails } from '../../../../server/models/Tv';
import Error from '../../../pages/_error';
import Header from '../../Common/Header';
import LoadingSpinner from '../../Common/LoadingSpinner';
import PageTitle from '../../Common/PageTitle';
import PersonCard from '../../PersonCard';

const messages = defineMessages({
  fullseriescrew: 'Full Series Crew',
});

const TvCrew: React.FC = () => {
  const router = useRouter();
  const intl = useIntl();
  const { data, error } = useSWR<TvDetails>(`/api/v1/tv/${router.query.tvId}`);

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <Error statusCode={404} />;
  }

  return (
    <>
      <PageTitle
        title={[intl.formatMessage(messages.fullseriescrew), data.name]}
      />
      <div className="mt-1 mb-5">
        <Header
          subtext={
            <Link href={`/tv/${data.id}`}>
              <a className="hover:underline">{data.name}</a>
            </Link>
          }
        >
          {intl.formatMessage(messages.fullseriescrew)}
        </Header>
      </div>
      <ul className="cards-vertical">
        {data?.credits.crew.map((person, index) => {
          return (
            <li key={`crew-${person.id}-${index}`}>
              <PersonCard
                name={person.name}
                personId={person.id}
                subName={person.job}
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

export default TvCrew;
