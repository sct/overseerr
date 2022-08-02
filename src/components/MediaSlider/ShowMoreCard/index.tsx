import { ArrowCircleRightIcon } from '@heroicons/react/solid';
import Link from 'next/link';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  seemore: 'See More',
});

interface ShowMoreCardProps {
  url: string;
  posters: (string | undefined)[];
}

const ShowMoreCard: React.FC<ShowMoreCardProps> = ({ url, posters }) => {
  const intl = useIntl();
  const [isHovered, setHovered] = useState(false);
  return (
    <Link href={url}>
      <a
        className={'w-36 sm:w-36 md:w-44'}
        onMouseEnter={() => {
          setHovered(true);
        }}
        onMouseLeave={() => setHovered(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setHovered(true);
          }
        }}
        role="link"
        tabIndex={0}
      >
        <div
          className={`relative w-36 transform-gpu cursor-pointer
         overflow-hidden rounded-xl text-white shadow-lg ring-1 transition duration-150 ease-in-out sm:w-36 md:w-44 ${
           isHovered
             ? 'scale-105 bg-gray-600 ring-gray-500'
             : 'scale-100 bg-gray-800 ring-gray-700'
         }`}
        >
          <div style={{ paddingBottom: '150%' }}>
            <div className="absolute inset-0 flex h-full w-full flex-col items-center p-2">
              <div className="relative z-10 flex h-full flex-wrap items-center justify-center opacity-30">
                {posters[0] && (
                  <div className="w-1/2 p-1">
                    <img
                      src={`//image.tmdb.org/t/p/w300_and_h450_face${posters[0]}`}
                      alt=""
                      className="w-full rounded-md"
                    />
                  </div>
                )}
                {posters[1] && (
                  <div className="w-1/2 p-1">
                    <img
                      src={`//image.tmdb.org/t/p/w300_and_h450_face${posters[1]}`}
                      alt=""
                      className="w-full rounded-md"
                    />
                  </div>
                )}
                {posters[2] && (
                  <div className="w-1/2 p-1">
                    <img
                      src={`//image.tmdb.org/t/p/w300_and_h450_face${posters[2]}`}
                      alt=""
                      className="w-full rounded-md"
                    />
                  </div>
                )}
                {posters[3] && (
                  <div className="w-1/2 p-1">
                    <img
                      src={`//image.tmdb.org/t/p/w300_and_h450_face${posters[3]}`}
                      alt=""
                      className="w-full rounded-md"
                    />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white">
                <ArrowCircleRightIcon className="w-14" />
                <div className="mt-2 font-extrabold">
                  {intl.formatMessage(messages.seemore)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>
    </Link>
  );
};

export default ShowMoreCard;
