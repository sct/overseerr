import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import Error from '@app/pages/_error';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  artist: 'Artist',
  release: 'Release',
  releaseDate: 'Release Date',
});

interface TrackDetailsResponse {
  id: string;
  title: string;
  length?: number;
  firstReleaseDate?: string;
  disambiguation?: string;
  artistCredit?: {
    artist: { id: string; name: string };
    name?: string;
  }[];
  releases?: {
    id: string;
    title: string;
    date?: string;
    country?: string;
  }[];
}

const formatLength = (length?: number) => {
  if (!length) return undefined;
  const totalSeconds = Math.floor(length / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const TrackDetails = () => {
  const router = useRouter();
  const intl = useIntl();
  const { data, error } = useSWR<TrackDetailsResponse>(
    router.query.mbid ? `/api/v1/music/track/${router.query.mbid}` : null
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    const statusCode =
      (error as { response?: { status?: number } })?.response?.status ?? 404;
    return <Error statusCode={statusCode} />;
  }

  const artistName =
    data.artistCredit?.[0]?.name || data.artistCredit?.[0]?.artist?.name || '';
  const releaseTitle = data.releases?.[0]?.title;
  const releaseDate = data.firstReleaseDate || data.releases?.[0]?.date;
  const length = formatLength(data.length);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <PageTitle title={data.title} />
      <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-gray-700">
        <h1 className="text-2xl font-bold text-white">{data.title}</h1>
        {data.disambiguation && (
          <p className="mt-1 text-sm text-gray-400">{data.disambiguation}</p>
        )}
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-300 sm:grid-cols-2">
          {artistName && (
            <div>
              <dt className="font-semibold text-gray-400">
                {intl.formatMessage(messages.artist)}
              </dt>
              <dd className="text-white">{artistName}</dd>
            </div>
          )}
          {releaseTitle && (
            <div>
              <dt className="font-semibold text-gray-400">
                {intl.formatMessage(messages.release)}
              </dt>
              <dd className="text-white">{releaseTitle}</dd>
            </div>
          )}
          {releaseDate && (
            <div>
              <dt className="font-semibold text-gray-400">
                {intl.formatMessage(messages.releaseDate)}
              </dt>
              <dd className="text-white">{releaseDate}</dd>
            </div>
          )}
          {length && (
            <div>
              <dt className="font-semibold text-gray-400">Length</dt>
              <dd className="text-white">{length}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
};

export default TrackDetails;
