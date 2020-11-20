import React from 'react';

interface PersonCardProps {
  name: string;
  subName?: string;
  profilePath?: string;
  canExpand?: boolean;
}

const PersonCard: React.FC<PersonCardProps> = ({
  name,
  subName,
  profilePath,
  canExpand = false,
}) => {
  return (
    <div
      className={`relative ${
        canExpand ? 'w-full' : 'w-36 sm:w-36 md:w-44'
      } bg-gray-600 rounded-lg text-white shadow-lg hover:bg-gray-500 transition ease-in-out duration-150 cursor-pointer`}
    >
      <div style={{ paddingBottom: '150%' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {profilePath && (
            <div
              style={{
                backgroundImage: `url(https://image.tmdb.org/t/p/w600_and_h900_bestv2${profilePath})`,
              }}
              className="rounded-full w-28 h-28 md:w-32 md:h-32 bg-cover bg-center mb-6"
            />
          )}
          {!profilePath && (
            <svg
              className="w-28 h-28 md:w-32 md:h-32 mb-6"
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
          <div className="whitespace-normal text-center">{name}</div>
          {subName && (
            <div className="whitespace-normal text-center text-sm text-gray-300">
              {subName}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonCard;
