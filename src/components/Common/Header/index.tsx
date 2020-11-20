import React from 'react';

interface HeaderProps {
  extraMargin?: number;
  subtext?: string;
}

const Header: React.FC<HeaderProps> = ({
  children,
  extraMargin = 0,
  subtext,
}) => {
  return (
    <div className="md:flex md:items-center md:justify-between mt-8 mb-8">
      <div className={`flex-1 min-w-0 mx-${extraMargin}`}>
        <h2 className="text-2xl font-bold leading-7 text-gray-100 sm:text-4xl sm:leading-9 truncate sm:overflow-visible">
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-indigo-400 to-purple-400">
            {children}
          </span>
        </h2>
        {subtext && <div className="text-gray-400 mt-2">{subtext}</div>}
      </div>
    </div>
  );
};

export default Header;
