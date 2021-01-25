import React from 'react';

interface HeaderProps {
  extraMargin?: number;
  subtext?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  children,
  extraMargin = 0,
  subtext,
}) => {
  return (
    <div className="md:flex md:items-center md:justify-between">
      <div className={`flex-1 min-w-0 mx-${extraMargin}`}>
        <h3 className="text-2xl leading-8 text-gray-100 sm:text-2xl sm:leading-9 truncate sm:overflow-visible">
          <span className="bg-clip-text">{children}</span>
        </h3>
        {subtext && <div className="text-gray-400 mt-2">{subtext}</div>}
      </div>
    </div>
  );
};

export default Header;
