import Image, { ImageProps } from 'next/image';
import React from 'react';
import useSettings from '../../../hooks/useSettings';
import addBasePath from '../../../utils/addBasePath';

/**
 * The CachedImage component should be used wherever
 * we want to offer the option to locally cache images.
 *
 * It uses the `next/image` Image component but overrides
 * the `unoptimized` prop based on the application setting `cacheImages`.
 **/
const CachedImage: React.FC<ImageProps> = (props) => {
  const { currentSettings } = useSettings();

  /* Check for internal urls and add base path */
  if (typeof props.src === 'string' && !props.src.includes('://')) {
    props = { ...props, src: addBasePath(props.src) };
  }
  return <Image unoptimized={!currentSettings.cacheImages} {...props} />;
};

export default CachedImage;
