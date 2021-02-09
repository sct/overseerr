import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { useUser } from '../../hooks/useUser';
import Error from '../../pages/_error';
import LoadingSpinner from '../Common/LoadingSpinner';
import { UserRequestsResponse } from '../../../server/interfaces/api/userInterfaces';
import Link from 'next/link';
import Slider from '../Slider';
import RequestCard from '../RequestCard';
import { MovieDetails } from '../../../server/models/Movie';
import { TvDetails } from '../../../server/models/Tv';
import ImageFader from '../Common/ImageFader';
import PageTitle from '../Common/PageTitle';
import ProfileHeader from './ProfileHeader';

type MediaTitle = MovieDetails | TvDetails;

const UserProfile: React.FC = () => {
  const router = useRouter();
  const { user, error } = useUser({
    id: Number(router.query.userId),
  });
  const [availableTitles, setAvailableTitles] = useState<
    Record<number, MediaTitle>
  >({});

  const { data: requests, error: requestError } = useSWR<UserRequestsResponse>(
    user ? `/api/v1/user/${user?.id}/requests?take=10&skip=0` : null
  );

  const updateAvailableTitles = useCallback(
    (requestId: number, mediaTitle: MediaTitle) => {
      setAvailableTitles((titles) => ({
        ...titles,
        [requestId]: mediaTitle,
      }));
    },
    []
  );

  useEffect(() => {
    setAvailableTitles({});
  }, [user?.id]);

  if (!user && !error) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Error statusCode={404} />;
  }

  return (
    <>
      <PageTitle title={user.displayName} />
      {Object.keys(availableTitles).length > 0 && (
        <div className="absolute left-0 right-0 z-0 -top-16 h-96">
          <ImageFader
            key={user.id}
            isDarker
            backgroundImages={Object.values(availableTitles)
              .filter((media) => media.backdropPath)
              .map(
                (media) =>
                  `//image.tmdb.org/t/p/w1920_and_h800_multi_faces/${media.backdropPath}`
              )
              .slice(0, 6)}
          />
        </div>
      )}
      <ProfileHeader user={user} />
      <div className="relative z-40 mt-6 mb-4 md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <Link href={`/user/${user?.id}/requests`}>
            <a className="inline-flex items-center text-xl leading-7 text-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate">
              <span>Recent Requests</span>
              <svg
                className="w-6 h-6 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </a>
          </Link>
        </div>
      </div>
      <div className="relative z-40">
        <Slider
          sliderKey="requests"
          isLoading={!requests && !requestError}
          isEmpty={!!requests && !requestError && requests.results.length === 0}
          items={(requests?.results ?? []).map((request) => (
            <RequestCard
              key={`request-slider-item-${request.id}`}
              request={request}
              onTitleData={updateAvailableTitles}
            />
          ))}
          placeholder={<RequestCard.Placeholder />}
          emptyMessage={'No Requests'}
        />
      </div>
    </>
  );
};

export default UserProfile;
