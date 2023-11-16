import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

const PullToRefresh = () => {
  const router = useRouter();
  const [pullStartPoint, setPullStartPoint] = useState<number>(0);
  const [pullChange, setPullChange] = useState<number>(0);
  const [iconPlacement, setIconPlacement] = useState<number>(0);
  const refreshDiv = useRef<HTMLDivElement>(null);

  // If pull change is greater than 20, we have passed
  // the initialization threshold of the pull to refresh
  // (the icon will start to show). If it hits 120,
  // the reload will start on release
  useEffect(() => {
    // Reload function that is called when reload threshold has been hit
    // Add loading class to determine when to add spin animation
    const forceReload = () => {
      refreshDiv.current?.classList.add('loading');
      setTimeout(() => {
        router.reload();
      }, 1000);
    };

    const html = document.querySelector('html');

    // Determines if we are at the top of the page
    // Locks or unlocks page when pulling down to refresh
    const pullStart = (e: TouchEvent) => {
      setPullStartPoint(e.targetTouches[0].screenY);

      if (window.scrollY === 0 && window.scrollX === 0) {
        refreshDiv.current?.classList.add('block');
        refreshDiv.current?.classList.remove('hidden');
        document.body.style.touchAction = 'none';
        document.body.style.overscrollBehavior = 'none';

        if (html) {
          html.style.overscrollBehavior = 'none';
        }
      } else {
        refreshDiv.current?.classList.remove('block');
        refreshDiv.current?.classList.add('hidden');
      }
    };

    // Tracks how far we have pulled down the refresh icon
    const pullDown = (e: TouchEvent) => {
      const screenY = e.targetTouches[0].screenY;
      const pullLength =
        pullStartPoint < screenY ? Math.abs(screenY - pullStartPoint) : 0;

      setPullChange(pullLength);

      // Lock the body when the icon is shown
      if (iconPlacement > 50) {
        document.body.style.overflow = 'hidden';
      }
    };

    // Will reload the page if we are past the threshold
    // Otherwise, we reset the pull
    const pullFinish = () => {
      setPullStartPoint(0);

      if (pullChange > 340) {
        forceReload();
      } else {
        setPullChange(0);
      }

      document.body.style.touchAction = 'auto';
      document.body.style.overscrollBehavior = 'auto';
      document.body.style.overflow = 'scroll';
      if (html) {
        html.style.overscrollBehavior = 'auto';
      }
    };

    window.addEventListener('touchstart', pullStart, { passive: false });
    window.addEventListener('touchmove', pullDown, { passive: false });
    window.addEventListener('touchend', pullFinish, { passive: false });

    // Determines the position of the icon based on
    // the pull-down distance to touch
    if (pullChange / 3 < 120 && pullChange > 20) {
      setIconPlacement(pullChange / 3);
    } else if (pullChange > 20) {
      setIconPlacement(120);
    } else {
      setIconPlacement(0);
    }

    return () => {
      window.removeEventListener('touchstart', pullStart);
      window.removeEventListener('touchmove', pullDown);
      window.removeEventListener('touchend', pullFinish);
    };
  }, [iconPlacement, pullChange, pullStartPoint, router]);

  return (
    <div
      ref={refreshDiv}
      className="absolute left-0 right-0 z-50 m-auto w-fit transition-all ease-out"
      style={{ top: iconPlacement }}
    >
      <div
        className={`${
          refreshDiv.current?.classList.contains('loading') && 'animate-spin'
        } relative -top-24 h-9 w-9 rounded-full border-4 border-gray-800 bg-gray-800 shadow-md shadow-black ring-1 ring-gray-700`}
        style={{ animationDirection: 'reverse' }}
      >
        <ArrowPathIcon
          className={`rounded-full ${
            pullChange > 340 && 'rotate-180'
          } text-indigo-500 transition-all duration-300`}
        />
      </div>
    </div>
  );
};

export default PullToRefresh;
