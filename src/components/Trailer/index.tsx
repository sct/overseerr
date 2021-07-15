import ReactDOM from 'react-dom';
import React, { useEffect } from 'react';
import ReactPlayer from 'react-player/youtube';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { XIcon } from '@heroicons/react/outline';

const Trailer: React.FC<{
  url: string;
  close: () => void;
}> = ({ url, close }) => {
  useLockBodyScroll(true);

  const escapeFunction = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.code === 'Escape') {
      close();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', escapeFunction, false);
    return () => {
      document.removeEventListener('keydown', escapeFunction, false);
    };
  }, []);

  return ReactDOM.createPortal(
    <>
      <div
        className={`fixed p-5 top-0 bottom-0 right-0 left-0 z-30 bg-black inset-0`}
      >
        <div className={`fixed top-0 left-0 z-40 p-1`}>
          <XIcon
            onClick={() => close()}
            onKeyPress={escapeFunction}
            className={`w-10 h-10 cursor-pointer fill-current text-indigo-500`}
          />
        </div>
        <div className={`aspect-w-16 aspect-h-9`}>
          <ReactPlayer
            width={`calc(100vw - 3rem)`}
            height={`calc(100vh - 3rem)`}
            url={url}
            playing={true}
            playsinline={true}
            controls={true}
            onEnded={() => close()}
          />
        </div>
      </div>
    </>,
    document.body
  );
};

export default Trailer;
