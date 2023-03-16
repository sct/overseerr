import { useLockBodyScroll } from '@app/hooks/useLockBodyScroll';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

const PullToRefresh = () => {
  const router = useRouter();

  const [pullStartPoint, setPullStartPoint] = useState(0);
  const [pullChange, setPullChange] = useState(0);
  const [unlockScreen, setUnlockScreen] = useState(true);
  const refreshDiv = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const forceReload = () => {
      refreshDiv.current?.classList.add('loading');
      setTimeout(() => {
        router.reload();
      }, 1000);
    };

    const pullStart = (e: TouchEvent) => {
      setPullStartPoint(e.targetTouches[0].screenY);
    };

    const pullDown = (e: TouchEvent) => {
      const screenY = e.targetTouches[0].screenY;

      const pullLength =
        pullStartPoint < screenY ? Math.abs(screenY - pullStartPoint) : 0;
      setPullChange(pullLength);
    };

    const pullFinish = () => {
      setPullStartPoint(0);

      if (pullChange > 240) {
        forceReload();
      } else {
        setPullChange(0);
      }
    };

    window.addEventListener('touchstart', pullStart);
    window.addEventListener('touchmove', pullDown);
    window.addEventListener('touchend', pullFinish);

    return () => {
      window.removeEventListener('touchstart', pullStart);
      window.removeEventListener('touchmove', pullDown);
      window.removeEventListener('touchend', pullFinish);
    };
  }, [pullChange, pullStartPoint, router, unlockScreen]);

  const isIconVisible = async (element: HTMLDivElement) => {
    return new Promise((resolve) => {
      const observer = new IntersectionObserver(([entry]) => {
        resolve(entry.intersectionRatio === 1);
        observer.disconnect();
      });
      observer.observe(element);
    });
  };

  useEffect(() => {
    const refreshIcon = document.getElementById(
      'refreshIcon'
    ) as HTMLDivElement;

    const checkIfVisible = async () => {
      if (await isIconVisible(refreshIcon)) {
        setUnlockScreen(false);
      } else {
        setUnlockScreen(true);
      }
    };

    window.addEventListener('touchmove', checkIfVisible);

    return () => {
      window.removeEventListener('touchmove', checkIfVisible);
    };
  }, []);

  useLockBodyScroll(true, unlockScreen);

  return (
    <div
      ref={refreshDiv}
      className="absolute left-0 right-0 -top-16 z-50 m-auto w-fit transition-all ease-out"
      style={{
        top:
          pullChange / 3 < 80 && pullChange > 20
            ? pullChange / 3
            : pullChange > 20
            ? 80
            : '',
      }}
      id="refreshIcon"
    >
      <div
        className={`${
          refreshDiv.current?.classList[9] === 'loading' && 'animate-spin'
        } ${
          pullChange > 240 ? 'rotate-180' : '-rotate-180'
        } p-2 transition-all duration-300`}
      >
        <ArrowPathIcon className="h-9 w-9 rounded-full border-4 border-gray-800 bg-gray-800 text-indigo-500 ring-1 ring-gray-700" />
      </div>
    </div>
  );
};

export default PullToRefresh;
