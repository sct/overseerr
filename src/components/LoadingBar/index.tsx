import { NProgress } from '@tanem/react-nprogress';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/router';

interface BarProps {
  progress: number;
  isFinished: boolean;
}

const domAvailable = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

const Bar = ({ progress, isFinished }: BarProps) => {
  return (
    <div
      className={`fixed top-0 left-0 z-50 w-full transition-opacity ease-out duration-400 ${
        isFinished ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className="duration-300 bg-indigo-400 transition-width"
        style={{
          height: '3px',
          width: `${progress * 100}%`,
        }}
      />
    </div>
  );
};

/* eslint-disable */
const MemoizedNProgress = React.memo(({ loading }: { loading: boolean }) => (
  <NProgress isAnimating={loading}>
    {({ isFinished, progress }) => (
      <Bar progress={progress} isFinished={isFinished} />
    )}
  </NProgress>
));
/* eslint-enable */

const LoadingBar = (): React.ReactPortal | null => {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleLoading = () => {
      setLoading(true);
    };
    const handleFinishedLoading = () => {
      setLoading(false);
    };
    router.events.on('routeChangeStart', handleLoading);
    router.events.on('routeChangeComplete', handleFinishedLoading);
    router.events.on('routeChangeError', handleFinishedLoading);

    return () => {
      router.events.off('routeChangeStart', handleLoading);
      router.events.off('routeChangeComplete', handleFinishedLoading);
      router.events.off('routeChangeError', handleFinishedLoading);
    };

    // Only want this to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return mounted && domAvailable
    ? ReactDOM.createPortal(
        <MemoizedNProgress loading={loading} />,

        // This will always exist :)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        document.getElementById('__next')
      )
    : null;
};

export default LoadingBar;
