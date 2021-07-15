import React, { ReactNode } from 'react';
import ButtonWithDropdown from '../ButtonWithDropdown';
import Trailer from '../../Trailer';

interface PlayButtonProps {
  links: PlayButtonLink[];
}

interface PlayButtonState {
  viewingUrl?: string;
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

const PlayButton = class PlaybuttonClass extends React.Component<
  PlayButtonProps,
  PlayButtonState
> {
  constructor(props: PlayButtonProps) {
    super(props);
    this.state = {
      viewingUrl: undefined,
    };
  }

  openLink(link: PlayButtonLink): void {
    switch (link.type) {
      case PlayButtonLinkTypes.Trailer:
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          this.deepLink(link.url);
          return;
        }
        this.setState({
          viewingUrl: link.url,
        });
        break;
      default:
        window.open(link.url, '_blank');
        break;
    }
  }

  deepLink(url: string): void {
    window.open(`/deep-link?url=${url}`, '_blank');
  }

  render(): JSX.Element | null {
    if (!this.props.links || !this.props.links.length) {
      return null;
    }

    return (
      <>
        <ButtonWithDropdown
          buttonType="ghost"
          text={
            <>
              {this.props.links[0].svg}
              <span>{this.props.links[0].text}</span>
            </>
          }
          onClick={() => this.openLink(this.props.links[0])}
        >
          {this.props.links.length > 1 &&
            this.props.links.slice(1).map((link, i) => {
              return (
                <ButtonWithDropdown.Item
                  key={`play-button-dropdown-item-${i}`}
                  onClick={() => this.openLink(link)}
                  buttonType="ghost"
                >
                  {link.svg}
                  <span>{link.text}</span>
                </ButtonWithDropdown.Item>
              );
            })}
        </ButtonWithDropdown>

        {this.state.viewingUrl ? (
          <Trailer
            url={this.state.viewingUrl}
            close={() => {
              this.setState({
                viewingUrl: undefined,
              });
            }}
          />
        ) : undefined}
      </>
    );
  }
};

export default PlayButton;
