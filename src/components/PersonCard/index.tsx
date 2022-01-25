import { UserCircleIcon } from '@heroicons/react/solid';
import Link from 'next/link';
import React, { useState } from 'react';
import CachedImage from '../Common/CachedImage';

interface PersonCardProps {
  personId: number;
  name: string;
  subName?: string;
  profilePath?: string;
  canExpand?: boolean;
}

const PersonCard: React.FC<PersonCardProps> = ({
  personId,
  name,
  subName,
  profilePath,
  canExpand = false,
}) => {
  const [isHovered, setHovered] = useState(false);

  return (
    <Link href={`/person/${personId}`}>
      <a
        className={canExpand ? 'w-full' : 'w-36 sm:w-36 md:w-44'}
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
          className={`relative ${
            canExpand ? 'w-full' : 'w-36 sm:w-36 md:w-44'
          } transform-gpu cursor-pointer rounded-xl text-white shadow ring-1 transition duration-150 ease-in-out ${
            isHovered
              ? 'scale-105 bg-gray-700 ring-gray-500'
              : 'scale-100 bg-gray-800 ring-gray-700'
          }`}
        >
          <div style={{ paddingBottom: '150%' }}>
            <div className="absolute inset-0 flex h-full w-full flex-col items-center p-2">
              <div className="relative mt-2 mb-4 flex h-1/2 w-full justify-center">
                {profilePath ? (
                  <div className="relative h-full w-3/4 overflow-hidden rounded-full ring-1 ring-gray-700">
                    <CachedImage
                      src={`https://image.tmdb.org/t/p/w600_and_h900_bestv2${profilePath}`}
                      alt=""
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                ) : (
                  <UserCircleIcon className="h-full" />
                )}
              </div>
              <div className="w-full truncate text-center font-bold">
                {name}
              </div>
              {subName && (
                <div
                  className="overflow-hidden whitespace-normal text-center text-sm text-gray-300"
                  style={{
                    WebkitLineClamp: 2,
                    display: '-webkit-box',
                    overflow: 'hidden',
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {subName}
                </div>
              )}
              <div
                className={`absolute bottom-0 left-0 right-0 h-12 rounded-b-xl bg-gradient-to-t ${
                  isHovered ? 'from-gray-800' : 'from-gray-900'
                }`}
              />
            </div>
          </div>
        </div>
      </a>
    </Link>
  );
};

export default PersonCard;
