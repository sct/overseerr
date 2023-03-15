import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

const PullToRefresh = () => {
  const router = useRouter();

  const [pullStartPoint, setPullStartPoint] = useState(0);
  const [pullChange, setPullChange] = useState(0);
  const refreshDiv = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const forceReload = () => {
      refreshDiv.current?.classList.add('loading');
      setTimeout(() => {
        router.reload();
      }, 1000);
    };

    console.log({ refreshDiv: refreshDiv.current?.classList });

    const pullStart = (e: TouchEvent) => {
      const { screenY } = e.targetTouches[0];
      setPullStartPoint(screenY);
    };

    const pull = (e: TouchEvent) => {
      const touch = e.targetTouches[0];

      const { screenY } = touch;

      const pullLength =
        pullStartPoint < screenY ? Math.abs(screenY - pullStartPoint) : 0;
      setPullChange(pullLength);
    };

    const endPull = () => {
      setPullStartPoint(0);

      if (pullChange > 200) {
        forceReload();
      } else {
        setPullChange(0);
      }
    };
    window.addEventListener('touchstart', pullStart);
    window.addEventListener('touchmove', pull);
    window.addEventListener('touchend', endPull);
    return () => {
      window.removeEventListener('touchstart', pullStart);
      window.removeEventListener('touchmove', pull);
      window.removeEventListener('touchend', endPull);
    };
  }, [pullChange, pullStartPoint, router]);

  return (
    <div
      ref={refreshDiv}
      className="absolute left-0 right-0 z-50 m-auto -mt-16 w-fit p-2 transition-all ease-out"
      style={{ marginTop: pullChange / 3.118 || '' }}
    >
      <div
        className={`${
          refreshDiv.current?.classList[10] === 'loading' && 'animate-spin'
        } ${
          pullChange > 200 && 'rotate-180 transform transition-all duration-300'
        }`}
        style={{ animationDirection: 'reverse' }}
      >
        <ArrowPathIcon className="h-9 w-9 rounded-full border-4 border-gray-800 bg-gray-800 text-indigo-500 ring-1 ring-gray-700" />
      </div>
    </div>
  );
};

export default PullToRefresh;
