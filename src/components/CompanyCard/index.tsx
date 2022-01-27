import Link from 'next/link';
import React, { useState } from 'react';

interface CompanyCardProps {
  name: string;
  image: string;
  url: string;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ image, url, name }) => {
  const [isHovered, setHovered] = useState(false);

  return (
    <Link href={url}>
      <a
        className={`relative flex h-32 w-56 transform-gpu cursor-pointer items-center justify-center p-8 shadow ring-1 transition duration-300 ease-in-out sm:h-36 sm:w-72 ${
          isHovered
            ? 'scale-105 bg-gray-700 ring-gray-500'
            : 'scale-100 bg-gray-800 ring-gray-700'
        } rounded-xl`}
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
        <img
          src={image}
          alt={name}
          className="relative z-40 max-h-full max-w-full"
        />
        <div
          className={`absolute bottom-0 left-0 right-0 z-0 h-12 rounded-b-xl bg-gradient-to-t ${
            isHovered ? 'from-gray-800' : 'from-gray-900'
          }`}
        />
      </a>
    </Link>
  );
};

export default CompanyCard;
