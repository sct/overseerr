import { debounce } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSpring } from 'react-spring';
import TitleCard from '../TitleCard';

interface SliderProps {
  sliderKey: string;
  items?: JSX.Element[];
  isLoading: boolean;
  isEmpty: boolean;
}

enum Direction {
  RIGHT,
  LEFT,
}

const Slider: React.FC<SliderProps> = ({
  sliderKey,
  items,
  isLoading,
  isEmpty,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPos, setScrollPos] = useState({ isStart: true, isEnd: false });

  const handleScroll = useCallback(() => {
    const scrollWidth = containerRef.current?.scrollWidth ?? 0;
    const clientWidth =
      containerRef.current?.getBoundingClientRect().width ?? 0;
    const scrollPosition = containerRef.current?.scrollLeft ?? 0;

    if (!items || items?.length === 0) {
      setScrollPos({ isStart: true, isEnd: true });
    } else if (clientWidth >= scrollWidth) {
      setScrollPos({ isStart: true, isEnd: true });
    } else if (
      scrollPosition >=
      (containerRef.current?.scrollWidth ?? 0) - clientWidth
    ) {
      setScrollPos({ isStart: false, isEnd: true });
    } else if (scrollPosition > 0) {
      setScrollPos({ isStart: false, isEnd: false });
    } else {
      setScrollPos({ isStart: true, isEnd: false });
    }
  }, [items]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedScroll = useCallback(
    debounce(() => handleScroll(), 50),
    [handleScroll]
  );

  useEffect(() => {
    const handleResize = () => {
      debouncedScroll();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [debouncedScroll]);

  useEffect(() => {
    handleScroll();
  }, [items, handleScroll]);

  const onScroll = () => {
    debouncedScroll();
  };

  const [, setX] = useSpring(() => ({
    from: { x: 0 },
    to: { x: 0 },
    onFrame: (props: { x: number }) => {
      if (containerRef.current) {
        containerRef.current.scrollLeft = props.x;
      }
    },
  }));

  const slide = (direction: Direction) => {
    const clientWidth =
      containerRef.current?.getBoundingClientRect().width ?? 0;
    const cardWidth =
      containerRef.current?.firstElementChild?.getBoundingClientRect().width ??
      0;
    const scrollPosition = containerRef.current?.scrollLeft ?? 0;
    const visibleItems = Math.floor(clientWidth / cardWidth);
    const scrollOffset = scrollPosition % cardWidth;

    if (direction === Direction.LEFT) {
      const newX = Math.max(
        scrollPosition - scrollOffset - visibleItems * cardWidth,
        0
      );
      setX({
        from: { x: scrollPosition },
        to: {
          x: newX,
        },
        onFrame: (props) => {
          if (containerRef.current) {
            containerRef.current.scrollLeft = props.x;
          }
        },
        reset: true,
        config: { friction: 60, tension: 500, velocity: 20 },
      });

      if (newX === 0) {
        setScrollPos({ isStart: true, isEnd: false });
      } else {
        setScrollPos({ isStart: false, isEnd: false });
      }
    } else if (direction === Direction.RIGHT) {
      const newX = Math.min(
        scrollPosition - scrollOffset + visibleItems * cardWidth,
        containerRef.current?.scrollWidth ?? 0 - clientWidth
      );
      setX({
        from: { x: scrollPosition },
        to: {
          x: newX,
        },
        onFrame: (props) => {
          if (containerRef.current) {
            containerRef.current.scrollLeft = props.x;
          }
        },
        reset: true,
        config: { friction: 60, tension: 500, velocity: 20 },
      });

      if (newX >= (containerRef.current?.scrollWidth ?? 0) - clientWidth) {
        setScrollPos({ isStart: false, isEnd: true });
      } else {
        setScrollPos({ isStart: false, isEnd: false });
      }
    }
  };

  return (
    <div className="relative">
      <div className="absolute flex text-gray-400 right-0 -mt-10">
        <button
          className={`${
            scrollPos.isStart ? 'cursor-not-allowed text-gray-800' : ''
          }`}
          onClick={() => slide(Direction.LEFT)}
          disabled={scrollPos.isStart}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          className={`${
            scrollPos.isEnd ? 'cursor-not-allowed text-gray-800' : ''
          }`}
          onClick={() => slide(Direction.RIGHT)}
          disabled={scrollPos.isEnd}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
      <div
        className="overflow-x-scroll whitespace-no-wrap hide-scrollbar scrolling-touch overscroll-x-contain -ml-4 -mr-4 px-2"
        ref={containerRef}
        onScroll={onScroll}
      >
        {items?.map((item, index) => (
          <div key={`${sliderKey}-${index}`} className="px-2 inline-block">
            {item}
          </div>
        ))}
        {isLoading &&
          [...Array(10)].map((_item, i) => (
            <div key={`placeholder-${i}`} className="px-2 inline-block">
              <TitleCard.Placeholder />
            </div>
          ))}
        {isEmpty && (
          <div className="text-center text-white mt-16 mb-16">No Results</div>
        )}
      </div>
    </div>
  );
};

export default Slider;
