import Link from 'next/link';
import React, { useContext } from 'react';
import useSWR from 'swr';
import type {
  MovieResult,
  PersonResult,
  TvResult,
} from '../../../server/models/Search';
import { LanguageContext } from '../../context/LanguageContext';
import PersonCard from '../PersonCard';
import Slider from '../Slider';
import TitleCard from '../TitleCard';

interface MixedResult {
  page: number;
  totalResults: number;
  totalPages: number;
  results: (TvResult | MovieResult | PersonResult)[];
}

interface MediaSliderProps {
  title: string;
  url: string;
  linkUrl?: string;
  sliderKey: string;
  hideWhenEmpty?: boolean;
}

const MediaSlider: React.FC<MediaSliderProps> = ({
  title,
  url,
  linkUrl,
  sliderKey,
  hideWhenEmpty = false,
}) => {
  const { locale } = useContext(LanguageContext);
  const { data, error } = useSWR<MixedResult>(`${url}?language=${locale}`);

  if (hideWhenEmpty && (data?.results ?? []).length === 0) {
    return null;
  }

  return (
    <>
      <div className="mt-6 mb-4 md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          {linkUrl ? (
            <Link href={linkUrl}>
              <a className="inline-flex items-center text-xl leading-7 text-gray-300 hover:text-white sm:text-2xl sm:leading-9 sm:truncate">
                <span>{title}</span>
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
          ) : (
            <div className="inline-flex items-center text-xl leading-7 text-gray-300 sm:text-2xl sm:leading-9 sm:truncate">
              <span>{title}</span>
            </div>
          )}
        </div>
      </div>
      <Slider
        sliderKey={sliderKey}
        isLoading={!data && !error}
        isEmpty={false}
        items={data?.results.map((title) => {
          switch (title.mediaType) {
            case 'movie':
              return (
                <TitleCard
                  id={title.id}
                  image={title.posterPath}
                  status={title.mediaInfo?.status}
                  summary={title.overview}
                  title={title.title}
                  userScore={title.voteAverage}
                  year={title.releaseDate}
                  mediaType={title.mediaType}
                />
              );
            case 'tv':
              return (
                <TitleCard
                  id={title.id}
                  image={title.posterPath}
                  status={title.mediaInfo?.status}
                  summary={title.overview}
                  title={title.name}
                  userScore={title.voteAverage}
                  year={title.firstAirDate}
                  mediaType={title.mediaType}
                />
              );
            case 'person':
              return (
                <PersonCard
                  personId={title.id}
                  name={title.name}
                  profilePath={title.profilePath}
                />
              );
          }
        })}
      />
    </>
  );
};

export default MediaSlider;
