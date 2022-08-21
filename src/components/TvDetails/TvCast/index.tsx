import Header from '@/components/Common/Header';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import PageTitle from '@/components/Common/PageTitle';
import PersonCard from '@/components/PersonCard';
import Error from '@/pages/_error';
import type { TvDetails } from '@server/models/Tv';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  fullseriescast: 'Full Series Cast',
});

const TvCast = () => {
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
        title={[intl.formatMessage(messages.fullseriescast), data.name]}
      />
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
      <ul className="cards-vertical">
        {data?.credits.cast.map((person) => {
          return (
            <li key={person.id}>
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
