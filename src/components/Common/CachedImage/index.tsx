import useSettings from '@app/hooks/useSettings';
import type { ImageLoader, ImageProps } from 'next/image';
import Image from 'next/image';

const imageLoader: ImageLoader = ({ src }) => src;

/**
 * The CachedImage component should be used wherever
 * we want to offer the option to locally cache images.
 *
 * It uses the `next/image` Image component but overrides
 * the `unoptimized` prop based on the application setting `cacheImages`.
 **/
const CachedImage = ({ src, ...props }: ImageProps) => {
  const { currentSettings } = useSettings();

  let imageUrl = src;

  if (
    typeof imageUrl === 'string' &&
    imageUrl.startsWith('https://image.tmdb.org') &&
    currentSettings.cacheImages
  ) {
    imageUrl = imageUrl.replace('https://image.tmdb.org', '/imageproxy');
  }

  return <Image unoptimized loader={imageLoader} src={imageUrl} {...props} />;
};

export default CachedImage;
