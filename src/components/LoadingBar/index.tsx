import { NProgress } from '@tanem/react-nprogress';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface BarProps {
  progress: number;
  isFinished: boolean;
}

const Bar = ({ progress, isFinished }: BarProps) => {
  return (
    <div
      className={`duration-400 fixed top-0 left-0 z-50 w-full transition-opacity ease-out ${
        isFinished ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className="bg-indigo-400 transition-width duration-300"
        style={{
          height: '3px',
          width: `${progress * 100}%`,
        }}
      />
    </div>
  );
};

const NProgressBar = ({ loading }: { loading: boolean }) => (
  <NProgress isAnimating={loading}>
    {({ isFinished, progress }) => (
      <Bar progress={progress} isFinished={isFinished} />
    )}
  </NProgress>
);

const MemoizedNProgress = React.memo(NProgressBar);

const LoadingBar = (): React.ReactPortal | null => {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted
    ? ReactDOM.createPortal(
        <MemoizedNProgress loading={loading} />,
        document.body
      )
    : null;
};

export default LoadingBar;
