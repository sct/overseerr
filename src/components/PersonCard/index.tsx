import Link from 'next/link';
import React from 'react';

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
  return (
    <Link href={`/person/${personId}`}>
      <a className={canExpand ? 'w-full' : 'w-36 sm:w-36 md:w-44'}>
        <div
          className={`relative ${
            canExpand ? 'w-full' : 'w-36 sm:w-36 md:w-44'
          } bg-gray-600 rounded-lg text-white shadow-lg hover:bg-gray-500 transition ease-in-out duration-150 cursor-pointer`}
        >
          <div style={{ paddingBottom: '150%' }}>
            <div className="absolute inset-0 flex flex-col items-center w-full h-full p-2">
              {profilePath && (
                <div className="relative flex justify-center w-full mt-2 mb-4 h-1/2">
                  <img
                    src={`https://image.tmdb.org/t/p/w600_and_h900_bestv2${profilePath}`}
                    className="object-cover w-3/4 h-full bg-center bg-cover rounded-full"
                    alt=""
                  />
                </div>
              )}
              {!profilePath && (
                <svg
                  className="mb-6 w-28 h-28 md:w-32 md:h-32"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <div className="w-full text-center truncate">{name}</div>
              {subName && (
                <div
                  className="overflow-hidden text-sm text-center text-gray-300 whitespace-normal"
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
              <div className="absolute bottom-0 left-0 right-0 h-12 rounded-b-lg bg-gradient-to-t from-gray-600" />
            </div>
          </div>
        </div>
      </a>
    </Link>
  );
};

export default PersonCard;
