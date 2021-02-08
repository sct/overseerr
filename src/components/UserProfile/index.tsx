import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';
import { Permission, User, useUser } from '../../hooks/useUser';
import Error from '../../pages/_error';
import Button from '../Common/Button';
import LoadingSpinner from '../Common/LoadingSpinner';
import { UserRequestsResponse } from '../../../server/interfaces/api/userInterfaces';
import Link from 'next/link';
import Slider from '../Slider';
import RequestCard from '../RequestCard';
import { MovieDetails } from '../../../server/models/Movie';
import { TvDetails } from '../../../server/models/Tv';
import ImageFader from '../Common/ImageFader';
import PageTitle from '../Common/PageTitle';

type MediaTitle = MovieDetails | TvDetails;

const UserProfile: React.FC = () => {
  const { hasPermission } = useUser();
  const router = useRouter();
  const intl = useIntl();
  const [availableTitles, setAvailableTitles] = useState<
    Record<number, MediaTitle>
  >({});
  const { data, error } = useSWR<User>(`/api/v1/user/${router.query.userId}`);

  const { data: requests, error: requestError } = useSWR<UserRequestsResponse>(
    data ? `/api/v1/user/${data?.id}/requests?take=10&skip=0` : null
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
  }, [data?.id]);

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <Error statusCode={404} />;
  }

  return (
    <>
      <PageTitle title={data.displayName} />
      {Object.keys(availableTitles).length > 0 && (
        <div className="absolute left-0 right-0 z-0 -top-16 h-96">
          <ImageFader
            key={data.id}
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
      <div className="relative z-40 mt-6 mb-12 md:flex md:items-end md:justify-between md:space-x-5">
        <div className="flex items-end space-x-5 justify-items-end">
          <div className="flex-shrink-0">
            <div className="relative">
              <img
                className="w-24 h-24 rounded-full"
                src={data.avatar}
                alt=""
              />
              <span
                className="absolute inset-0 rounded-full shadow-inner"
                aria-hidden="true"
              ></span>
            </div>
          </div>
          <div className="pt-1.5">
            <h1 className="mb-1">
              <span className="text-2xl font-bold text-gray-100">
                {data.displayName}
              </span>
              {data.email && (
                <span className="ml-2 text-lg text-gray-400">
                  ({data.email})
                </span>
              )}
            </h1>
            <p className="text-sm font-medium text-gray-400">
              Joined {intl.formatDate(data.createdAt)} |{' '}
              {intl.formatNumber(data.requestCount)} Requests
            </p>
          </div>
        </div>
        <div className="flex flex-col-reverse mt-6 space-y-4 space-y-reverse justify-stretch sm:flex-row-reverse sm:justify-end sm:space-x-reverse sm:space-y-0 sm:space-x-3 md:mt-0 md:flex-row md:space-x-3">
          {hasPermission(Permission.MANAGE_USERS) && (
            <Link href={`/users/${data.id}/edit`}>
              <Button buttonType="warning" as="a">
                Edit User
              </Button>
            </Link>
          )}
        </div>
      </div>
      <div className="relative z-40 mt-6 mb-4 md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <Link href={`/user/${data?.id}/requests`}>
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
