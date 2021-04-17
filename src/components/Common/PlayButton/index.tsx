import { PlayIcon } from '@heroicons/react/outline';
import React from 'react';
import ButtonWithDropdown from '../ButtonWithDropdown';

interface PlayButtonProps {
  links: PlayButtonLink[];
}

export interface PlayButtonLink {
  text: string;
  url: string;
}

const PlayButton: React.FC<PlayButtonProps> = ({ links }) => {
  if (!links || !links.length) {
    return null;
  }

  return (
    <ButtonWithDropdown
      buttonType="ghost"
      text={
        <>
          <PlayIcon className="w-5 h-5 mr-1" />
          <span>{links[0].text}</span>
        </>
      }
      onClick={() => {
        window.open(links[0].url, '_blank');
      }}
    >
      {links.length > 1 &&
        links.slice(1).map((link, i) => {
          return (
            <ButtonWithDropdown.Item
              key={`play-button-dropdown-item-${i}`}
              onClick={() => {
                window.open(link.url, '_blank');
              }}
              buttonType="ghost"
            >
              {link.text}
            </ButtonWithDropdown.Item>
          );
        })}
    </ButtonWithDropdown>
  );
};

export default PlayButton;
