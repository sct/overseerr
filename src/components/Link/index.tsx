import NextLink, { LinkProps } from 'next/link';
import React from 'react';
import addBasePath from '../../utils/addBasePath';

const Link: React.FC<LinkProps> = ({ href, ...props }) => {
  if (props.as) {
    props.as = addBasePath(props.as);
  }
  return <NextLink href={addBasePath(href)} {...props} />;
};

export default Link;
