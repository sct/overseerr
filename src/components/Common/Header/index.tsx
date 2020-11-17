import React from 'react';

interface HeaderProps {
  extraMargin?: number;
}

const Header: React.FC<HeaderProps> = ({ children, extraMargin = 0 }) => {
  return (
    <div className="md:flex md:items-center md:justify-between mt-8 mb-8">
      <div className={`flex-1 min-w-0 mx-${extraMargin}`}>
        <h2 className="text-2xl font-bold leading-7 text-cool-gray-100 sm:text-4xl sm:leading-9 truncate sm:overflow-visible">
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-indigo-400 to-purple-400">
            {children}
          </span>
        </h2>
      </div>
    </div>
  );
};

export default Header;
