import React from 'react';
import TitleCard from '../TitleCard';

interface SliderProps {
  key: string;
  items?: JSX.Element[];
  isLoading: boolean;
  isEmpty: boolean;
}

const Slider: React.FC<SliderProps> = ({ key, items, isLoading, isEmpty }) => {
  return (
    <div
      className="overflow-x-scroll whitespace-no-wrap hide-scrollbar scrolling-touch overscroll-x-contain -ml-4 -mr-4"
      style={{ height: 295 }}
    >
      {items?.map((item, index) => (
        <div
          key={`${key}-${index}`}
          className="first:px-4 last:px-4 px-2 inline-block"
        >
          {item}
        </div>
      ))}
      {isLoading &&
        [...Array(10)].map((_item, i) => (
          <div
            key={`placeholder-${i}`}
            className="first:px-4 last:px-4 px-2 inline-block"
          >
            <TitleCard.Placeholder />
          </div>
        ))}
      {isEmpty && (
        <div className="text-center text-white mt-32">No Results</div>
      )}
    </div>
  );
};

export default Slider;
