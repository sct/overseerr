import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

const PullToRefresh = () => {
  const router = useRouter();

  const [pullStartPoint, setPullStartPoint] = useState(0);
  const [pullChange, setPullChange] = useState(0);
  const refreshDiv = useRef<HTMLDivElement>(null);

  const pullDownInitThreshold = pullChange > 20;
  const pullDownStopThreshold = 120;
  const pullDownReloadThreshold = pullChange > 340;
  const pullDownIconLocation = pullChange / 3;

  useEffect(() => {
    const forceReload = () => {
      refreshDiv.current?.classList.add('loading');
      setTimeout(() => {
        router.reload();
      }, 1000);
    };

    const html = document.querySelector('html');

    const pullStart = (e: TouchEvent) => {
      setPullStartPoint(e.targetTouches[0].screenY);

      if (window.scrollY === 0 && window.scrollX === 0) {
        document.body.style.touchAction = 'none';
        document.body.style.overscrollBehavior = 'none';
        if (html) {
          html.style.overscrollBehaviorY = 'none';
        }
      }
    };

    const pullDown = async (e: TouchEvent) => {
      const screenY = e.targetTouches[0].screenY;

      const pullLength =
        pullStartPoint < screenY ? Math.abs(screenY - pullStartPoint) : 0;

      setPullChange(pullLength);
    };

    const pullFinish = () => {
      setPullStartPoint(0);

      if (pullDownReloadThreshold) {
        forceReload();
      } else {
        setPullChange(0);
      }

      document.body.style.touchAction = 'auto';
      document.body.style.overscrollBehaviorY = 'auto';
      if (html) {
        html.style.overscrollBehaviorY = 'auto';
      }
    };

    window.addEventListener('touchstart', pullStart, { passive: false });
    window.addEventListener('touchmove', pullDown, { passive: false });
    window.addEventListener('touchend', pullFinish, { passive: false });

    return () => {
      window.removeEventListener('touchstart', pullStart);
      window.removeEventListener('touchmove', pullDown);
      window.removeEventListener('touchend', pullFinish);
    };
  }, [pullDownInitThreshold, pullDownReloadThreshold, pullStartPoint, router]);

  return (
    <div
      ref={refreshDiv}
      className="absolute left-0 right-0 top-0 z-50 m-auto w-fit transition-all ease-out"
      id="refreshIcon"
      style={{
        top:
          pullDownIconLocation < pullDownStopThreshold && pullDownInitThreshold
            ? pullDownIconLocation
            : pullDownInitThreshold
            ? pullDownStopThreshold
            : '',
      }}
    >
      <div
        className={`${
          refreshDiv.current?.classList[9] === 'loading' && 'animate-spin'
        } relative -top-24 h-9 w-9 rounded-full border-4 border-gray-800 bg-gray-800 shadow-md shadow-black ring-1 ring-gray-700`}
        style={{ animationDirection: 'reverse' }}
      >
        <ArrowPathIcon
          className={`rounded-full ${
            pullDownReloadThreshold && 'rotate-180'
          } text-indigo-500 transition-all duration-300`}
        />
      </div>
    </div>
  );
};

export default PullToRefresh;
