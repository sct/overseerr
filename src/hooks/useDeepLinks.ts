import { useEffect, useState } from 'react';

interface useDeepLinksProps {
  plexUrl?: string;
  plexUrl4k?: string;
  iOSPlexUrl?: string;
  iOSPlexUrl4k?: string;
}

const useDeepLinks = ({
  plexUrl,
  plexUrl4k,
  iOSPlexUrl,
  iOSPlexUrl4k,
}: useDeepLinksProps) => {
  const [returnedPlexUrl, setReturnedPlexUrl] = useState(plexUrl);
  const [returnedPlexUrl4k, setReturnedPlexUrl4k] = useState(plexUrl4k);

  useEffect(() => {
    if (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent === 'MacIntel' && navigator.maxTouchPoints > 1)
    ) {
      setReturnedPlexUrl(iOSPlexUrl);
      setReturnedPlexUrl4k(iOSPlexUrl4k);
    } else {
      setReturnedPlexUrl(plexUrl);
      setReturnedPlexUrl4k(plexUrl4k);
    }
  }, [iOSPlexUrl, iOSPlexUrl4k, plexUrl, plexUrl4k]);

  return { plexUrl: returnedPlexUrl, plexUrl4k: returnedPlexUrl4k };
};

export default useDeepLinks;
