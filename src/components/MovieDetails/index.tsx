import React, { useState } from 'react';
import type { MovieDetails as MovieDetailsType } from '../../../server/models/Movie';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import { useToasts } from 'react-toast-notifications';
import Button from '../Common/Button';
import MovieRequestModal from '../RequestModal/MovieRequestModal';
import type { MediaRequest } from '../../../server/entity/MediaRequest';
import axios from 'axios';
import type { MovieResult } from '../../../server/models/Search';
import Link from 'next/link';
import Slider from '../Slider';
import TitleCard from '../TitleCard';

interface MovieDetailsProps {
  movie?: MovieDetailsType;
}

interface SearchResult {
  page: number;
  totalResults: number;
  totalPages: number;
  results: MovieResult[];
}

enum MediaRequestStatus {
  PENDING = 1,
  APPROVED,
  DECLINED,
  AVAILABLE,
}

const MovieDetails: React.FC<MovieDetailsProps> = ({ movie }) => {
  const router = useRouter();
  const { addToast } = useToasts();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { data, error, revalidate } = useSWR<MovieDetailsType>(
    `/api/v1/movie/${router.query.movieId}`,
    {
      initialData: movie,
    }
  );
  const { data: recommended, error: recommendedError } = useSWR<SearchResult>(
    `/api/v1/movie/${router.query.movieId}/recommendations`
  );
  const { data: similar, error: similarError } = useSWR<SearchResult>(
    `/api/v1/movie/${router.query.movieId}/similar`
  );

  const request = async () => {
    const response = await axios.post<MediaRequest>('/api/v1/request', {
      mediaId: data?.id,
      mediaType: 'movie',
    });

    if (response.data) {
      revalidate();
      addToast(
        <span>
          <strong>{data?.title}</strong> succesfully requested!
        </span>,
        { appearance: 'success', autoDismiss: true }
      );
    }
  };

  const cancelRequest = async () => {
    const response = await axios.delete<MediaRequest>(
      `/api/v1/request/${data?.request?.id}`
    );

    if (response.data.id) {
      revalidate();
    }
  };

  if (!data && !error) {
    return <div>loading!</div>;
  }

  if (!data) {
    return <div>Unknwon?</div>;
  }
  return (
    <div
      className="bg-cover bg-center -mx-4 -mt-2 px-4 sm:px-8 pt-4 "
      style={{
        height: 493,
        backgroundImage: `linear-gradient(180deg, rgba(45, 55, 72, 0.47) 0%, #1A202E 100%), url(//image.tmdb.org/t/p/w1920_and_h800_multi_faces/${data.backdropPath})`,
      }}
    >
      <MovieRequestModal
        type="request"
        visible={showRequestModal}
        title={data.title}
        onCancel={() => setShowRequestModal(false)}
        onOk={() => request()}
      />
      <MovieRequestModal
        type="cancel"
        visible={showCancelModal}
        title={data.title}
        onCancel={() => setShowCancelModal(false)}
        onOk={() => cancelRequest()}
      />
      <div className="flex flex-col items-center md:flex-row md:items-end pt-4">
        <div className="mr-4 flex-shrink-0">
          <img
            src={`//image.tmdb.org/t/p/w600_and_h900_bestv2${data.posterPath}`}
            alt=""
            className="rounded shadow md:shadow-2xl w-32 md:w-52"
          />
        </div>
        <div className="text-white flex flex-col mr-4 mt-4 md:mt-0 text-center md:text-left">
          <span className="md:text-2xl md:leading-none">
            {data.releaseDate.slice(0, 4)}
          </span>
          <h1 className="text-2xl md:text-4xl">{data.title}</h1>
          <span className="text-xs md:text-base mt-1 md:mt-0">
            {data.runtime} minutes | {data.genres.map((g) => g.name).join(', ')}
          </span>
        </div>
        <div className="flex-1 flex justify-end mt-4 md:mt-0">
          {!data.request && (
            <Button
              buttonType="primary"
              onClick={() => setShowRequestModal(true)}
            >
              <svg
                className="w-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Request
            </Button>
          )}
          {data.request?.status === MediaRequestStatus.PENDING && (
            <Button
              buttonType="warning"
              onClick={() => setShowCancelModal(true)}
            >
              <svg
                className="w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              Pending
            </Button>
          )}
          {data.request?.status === MediaRequestStatus.APPROVED && (
            <Button buttonType="danger">
              <svg
                className="w-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Unavailable
            </Button>
          )}
          {data.request?.status === MediaRequestStatus.AVAILABLE && (
            <Button buttonType="success">
              <svg
                className="w-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Available
            </Button>
          )}
          <Button buttonType="danger" className="ml-2">
            <svg
              className="w-5"
              style={{ height: 20 }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </Button>
          <Button buttonType="default" className="ml-2">
            <svg
              className="w-5"
              style={{ height: 20 }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Button>
        </div>
      </div>
      <div className="flex pt-8 text-white flex-col md:flex-row pb-4">
        <div className="flex-1 md:mr-8">
          <h2 className="text-xl md:text-2xl">Overview</h2>
          <p className="pt-2 text-sm md:text-base">{data.overview}</p>
        </div>
        <div className="w-full md:w-80 mt-8 md:mt-0">
          <div className="bg-cool-gray-900 rounded-lg shadow border border-cool-gray-800">
            <div className="flex px-4 py-2 border-b border-cool-gray-800 last:border-b-0">
              <span className="text-sm">Status</span>
              <span className="flex-1 text-right text-cool-gray-400 text-sm">
                {data.status}
              </span>
            </div>
            <div className="flex px-4 py-2 border-b border-cool-gray-800 last:border-b-0">
              <span className="text-sm">Revenue</span>
              <span className="flex-1 text-right text-cool-gray-400 text-sm">
                {data.revenue}
              </span>
            </div>
            <div className="flex px-4 py-2 border-b border-cool-gray-800 last:border-b-0">
              <span className="text-sm">Budget</span>
              <span className="flex-1 text-right text-cool-gray-400 text-sm">
                {data.budget}
              </span>
            </div>
            <div className="flex px-4 py-2 border-b border-cool-gray-800 last:border-b-0">
              <span className="text-sm">Original Language</span>
              <span className="flex-1 text-right text-cool-gray-400 text-sm">
                {data.originalLanguage}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="md:flex md:items-center md:justify-between mb-4 mt-6">
        <div className="flex-1 min-w-0">
          <Link
            href="/movie/[movieId]/recommendations"
            as={`/movie/${data.id}/recommendations`}
          >
            <a className="inline-flex text-xl leading-7 text-cool-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate items-center">
              <span>Recommendations</span>
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
      <Slider
        sliderKey="recommendations"
        isLoading={!recommended && !recommendedError}
        isEmpty={false}
        items={recommended?.results.map((title) => (
          <TitleCard
            key={`recommended-${title.id}`}
            id={title.id}
            image={title.posterPath}
            status={title.request?.status}
            summary={title.overview}
            title={title.title}
            userScore={title.voteAverage}
            year={title.releaseDate}
            mediaType={title.mediaType}
            requestId={title.request?.id}
          />
        ))}
      />
      <div className="md:flex md:items-center md:justify-between mb-4 mt-6">
        <div className="flex-1 min-w-0">
          <Link
            href="/movie/[movieId]/similar"
            as={`/movie/${data.id}/similar`}
          >
            <a className="inline-flex text-xl leading-7 text-cool-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate items-center">
              <span>Similar Titles</span>
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
      <Slider
        sliderKey="recommendations"
        isLoading={!similar && !similarError}
        isEmpty={false}
        items={similar?.results.map((title) => (
          <TitleCard
            key={`recommended-${title.id}`}
            id={title.id}
            image={title.posterPath}
            status={title.request?.status}
            summary={title.overview}
            title={title.title}
            userScore={title.voteAverage}
            year={title.releaseDate}
            mediaType={title.mediaType}
            requestId={title.request?.id}
          />
        ))}
      />
      <div className="pb-8" />
    </div>
  );
};

export default MovieDetails;
