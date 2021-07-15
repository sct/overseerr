import React, { ReactNode, useState } from 'react';

import ButtonWithDropdown from '../ButtonWithDropdown';
import Trailer from '../../Trailer';

interface PlayButtonProps {
  links: PlayButtonLink[];
}

export enum PlayButtonLinkTypes {
  Web = 'web',
  Trailer = 'trailer',
}

export interface PlayButtonLink {
  type?: string;
  text: string;
  url: string;
  svg: ReactNode;
}

const PlayButton: React.FC<PlayButtonProps> = ({ links }) => {
  const [viewingUrl, setViewingUrl] = useState<string | undefined>();

  function openLink(link: PlayButtonLink): void {
    switch (link.type) {
      case PlayButtonLinkTypes.Trailer:
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          window.open(`/deep-link?url=${link.url}`, '_blank');
          return;
        }

        setViewingUrl(link.url);
        break;
      default:
        window.open(link.url, '_blank');
        break;
    }
  }

  if (!links || !links.length) {
    return null;
  }

  return (
    <>
      <ButtonWithDropdown
        buttonType="ghost"
        text={
          <>
            {links[0].svg}
            <span>{links[0].text}</span>
          </>
        }
        onClick={() => openLink(links[0])}
      >
        {links.length > 1 &&
          links.slice(1).map((link, i) => {
            return (
              <ButtonWithDropdown.Item
                key={`play-button-dropdown-item-${i}`}
                onClick={() => openLink(link)}
                buttonType="ghost"
              >
                {link.svg}
                <span>{link.text}</span>
              </ButtonWithDropdown.Item>
            );
          })}
      </ButtonWithDropdown>

      {viewingUrl ? (
        <Trailer
          url={viewingUrl}
          close={() => {
            setViewingUrl(undefined);
          }}
        />
      ) : undefined}
    </>
  );
};

export default PlayButton;
