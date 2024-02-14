import useSettings from '@app/hooks/useSettings';
import type { ImageLoader, ImageProps } from 'next/image';
import Image from 'next/image';
import { useState } from 'react';

const imageLoader: ImageLoader = ({ src }) => src;

/**
 * The CachedImage component should be used wherever
 * we want to offer the option to locally cache images.
 **/
const CachedImage = ({ src, ...props }: ImageProps) => {
  const { currentSettings } = useSettings();
  const [imageUrl, setImageUrl] = useState<string>(src as string);

  const handleError = () => {
    setImageUrl(currentSettings?.fallbackImage);
  };

  if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
    const parsedUrl = new URL(imageUrl);

    if (parsedUrl.host === 'image.tmdb.org' && currentSettings.cacheImages) {
      setImageUrl(imageUrl.replace('https://image.tmdb.org', '/imageproxy'));
    }
  }

  return (
    <Image
      unoptimized
      loader={imageLoader}
      src={imageUrl}
      onError={handleError}
      {...props}
    />
  );
};

export default CachedImage;
