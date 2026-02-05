import TitleCard from '@app/components/TitleCard';
import globalMessages from '@app/i18n/globalMessages';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { debounce } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useSpring } from 'react-spring';

interface SliderProps {
  sliderKey: string;
  items?: JSX.Element[];
  isLoading: boolean;
  isEmpty?: boolean;
  emptyMessage?: React.ReactNode;
  placeholder?: React.ReactNode;
}

enum Direction {
  RIGHT,
  LEFT,
}

const Slider = ({
  sliderKey,
  items,
  isLoading,
  isEmpty = false,
  emptyMessage,
  placeholder = <TitleCard.Placeholder />,
}: SliderProps) => {
  const intl = useIntl();
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
    onChange: (results) => {
      if (containerRef.current) {
        containerRef.current.scrollLeft = results.value.x;
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
      setX.start({
        from: { x: scrollPosition },
        to: { x: newX },
        onChange: (results) => {
          if (containerRef.current) {
            containerRef.current.scrollLeft = results.value.x;
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
      setX.start({
        from: { x: scrollPosition },
        to: { x: newX },
        onChange: (results) => {
          if (containerRef.current) {
            containerRef.current.scrollLeft = results.value.x;
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
    <div className="group relative" data-testid="media-slider">
      <div className="absolute right-0 -mt-10 flex items-center gap-1">
        <button
          className={`rounded-md p-1 transition-all duration-200 ${
            scrollPos.isStart
              ? 'cursor-not-allowed text-gray-800'
              : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
          }`}
          onClick={() => slide(Direction.LEFT)}
          disabled={scrollPos.isStart}
          type="button"
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <button
          className={`rounded-md p-1 transition-all duration-200 ${
            scrollPos.isEnd
              ? 'cursor-not-allowed text-gray-800'
              : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
          }`}
          onClick={() => slide(Direction.RIGHT)}
          disabled={scrollPos.isEnd}
          type="button"
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      </div>
      <div
        className="hide-scrollbar relative -my-2 -ml-4 -mr-4 overflow-y-auto overflow-x-scroll overscroll-x-contain whitespace-nowrap px-2 py-2"
        ref={containerRef}
        onScroll={onScroll}
      >
        {items?.map((item, index) => (
          <div
            key={`${sliderKey}-${index}`}
            className="inline-block px-2 align-top"
          >
            {item}
          </div>
        ))}
        {isLoading &&
          [...Array(10)].map((_item, i) => (
            <div
              key={`placeholder-${i}`}
              className="inline-block px-2 align-top"
            >
              {placeholder}
            </div>
          ))}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800/80">
              <svg
                className="h-8 w-8 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <p className="font-medium text-gray-400">
              {emptyMessage
                ? emptyMessage
                : intl.formatMessage(globalMessages.noresults)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Slider;
