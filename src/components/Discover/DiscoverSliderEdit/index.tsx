import Button from '@app/components/Common/Button';
import SlideCheckbox from '@app/components/Common/SlideCheckbox';
import Tooltip from '@app/components/Common/Tooltip';
import { sliderTitles } from '@app/components/Discover/constants';
import KeywordTag from '@app/components/KeywordTag';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';
import { DiscoverSliderType } from '@server/constants/discover';
import type DiscoverSlider from '@server/entity/DiscoverSlider';
import axios from 'axios';
import { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-aria';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';

const messages = defineMessages({
  deletesuccess: 'Sucessfully deleted slider.',
  deletefail: 'Failed to delete slider.',
  remove: 'Remove',
  enable: 'Toggle Visibility',
});

const Position = {
  None: 'None',
  Above: 'Above',
  Below: 'Below',
} as const;

type DiscoverSliderEditProps = {
  slider: Partial<DiscoverSlider>;
  onEnable: () => void;
  onDelete: () => void;
  onPositionUpdate: (
    updatedItemId: number,
    position: keyof typeof Position
  ) => void;
  children: React.ReactNode;
};

const DiscoverSliderEdit = ({
  slider,
  children,
  onEnable,
  onDelete,
  onPositionUpdate,
}: DiscoverSliderEditProps) => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const ref = useRef<HTMLDivElement>(null);
  const [hoverPosition, setHoverPosition] = useState<keyof typeof Position>(
    Position.None
  );

  const { dragProps, isDragging } = useDrag({
    getItems() {
      return [{ id: (slider.id ?? -1).toString(), title: slider.title ?? '' }];
    },
  });

  const deleteSlider = async () => {
    try {
      await axios.delete(`/api/v1/settings/discover/${slider.id}`);
      addToast(intl.formatMessage(messages.deletesuccess), {
        appearance: 'success',
        autoDismiss: true,
      });
      onDelete();
    } catch (e) {
      addToast(intl.formatMessage(messages.deletefail), {
        appearance: 'error',
        autoDismiss: true,
      });
    }
  };

  const { dropProps } = useDrop({
    ref,
    onDropMove: (e) => {
      if (ref.current) {
        const middlePoint = ref.current.offsetHeight / 2;

        if (e.y < middlePoint) {
          setHoverPosition(Position.Above);
        } else {
          setHoverPosition(Position.Below);
        }
      }
    },
    onDropExit: () => {
      setHoverPosition(Position.None);
    },
    onDrop: async (e) => {
      const items = await Promise.all(
        e.items
          .filter((item) => item.kind === 'text' && item.types.has('id'))
          .map(async (item) => {
            if (item.kind === 'text') {
              return item.getText('id');
            }
          })
      );
      if (items?.[0]) {
        const dropped = Number(items[0]);
        onPositionUpdate(dropped, hoverPosition);
      }
    },
  });

  const getSliderTitle = (slider: Partial<DiscoverSlider>): string => {
    switch (slider.type) {
      case DiscoverSliderType.RECENTLY_ADDED:
        return intl.formatMessage(sliderTitles.recentlyAdded);
      case DiscoverSliderType.RECENT_REQUESTS:
        return intl.formatMessage(sliderTitles.recentrequests);
      case DiscoverSliderType.PLEX_WATCHLIST:
        return intl.formatMessage(sliderTitles.plexwatchlist);
      case DiscoverSliderType.TRENDING:
        return intl.formatMessage(sliderTitles.trending);
      case DiscoverSliderType.POPULAR_MOVIES:
        return intl.formatMessage(sliderTitles.popularmovies);
      case DiscoverSliderType.MOVIE_GENRES:
        return intl.formatMessage(sliderTitles.moviegenres);
      case DiscoverSliderType.UPCOMING_MOVIES:
        return intl.formatMessage(sliderTitles.upcoming);
      case DiscoverSliderType.STUDIOS:
        return intl.formatMessage(sliderTitles.studios);
      case DiscoverSliderType.POPULAR_TV:
        return intl.formatMessage(sliderTitles.populartv);
      case DiscoverSliderType.TV_GENRES:
        return intl.formatMessage(sliderTitles.tvgenres);
      case DiscoverSliderType.UPCOMING_TV:
        return intl.formatMessage(sliderTitles.upcomingtv);
      case DiscoverSliderType.NETWORKS:
        return intl.formatMessage(sliderTitles.networks);
      case DiscoverSliderType.TMDB_MOVIE_KEYWORD:
        return intl.formatMessage(sliderTitles.tmdbmoviekeyword);
      case DiscoverSliderType.TMDB_TV_KEYWORD:
        return intl.formatMessage(sliderTitles.tmdbtvkeyword);
      case DiscoverSliderType.TMDB_MOVIE_GENRE:
        return intl.formatMessage(sliderTitles.tmdbmoviegenre);
      case DiscoverSliderType.TMDB_TV_GENRE:
        return intl.formatMessage(sliderTitles.tmdbtvgenre);
      case DiscoverSliderType.TMDB_STUDIO:
        return intl.formatMessage(sliderTitles.tmdbstudio);
      case DiscoverSliderType.TMDB_NETWORK:
        return intl.formatMessage(sliderTitles.tmdbnetwork);
      case DiscoverSliderType.TMDB_SEARCH:
        return intl.formatMessage(sliderTitles.tmdbsearch);
      default:
        return 'Unknown Slider';
    }
  };

  return (
    <div
      key={`discover-slider-${slider.id}-editing`}
      className={`relative mb-4 rounded-lg bg-gray-800 shadow-md ${
        isDragging ? 'opacity-0' : 'opacity-100'
      }`}
      {...dragProps}
      {...dropProps}
      ref={ref}
    >
      {hoverPosition === Position.Above && (
        <div
          className={`absolute -top-3 left-0 w-full border-t-4 border-indigo-500`}
        />
      )}
      {hoverPosition === Position.Below && (
        <div
          className={`absolute -bottom-2 left-0 w-full border-t-4 border-indigo-500`}
        />
      )}
      <div className="flex w-full items-center space-x-2 rounded-t-lg border-t border-l border-r border-gray-800 bg-gray-900 p-4 text-gray-400">
        <Bars3Icon className="h-6 w-6" />
        <div>{getSliderTitle(slider)}</div>
        <div className="flex-1 pl-2">
          {(slider.type === DiscoverSliderType.TMDB_MOVIE_KEYWORD ||
            slider.type === DiscoverSliderType.TMDB_TV_KEYWORD) && (
            <div className="flex space-x-2">
              {slider.data?.split(',').map((keywordId) => (
                <KeywordTag
                  key={`slider-keywords-${slider.id}-${keywordId}`}
                  keywordId={Number(keywordId)}
                />
              ))}
            </div>
          )}
        </div>
        {!slider.isBuiltIn && (
          <div className="px-2">
            <Button
              buttonType="danger"
              buttonSize="sm"
              onClick={() => {
                deleteSlider();
              }}
            >
              <XMarkIcon />
              <span>{intl.formatMessage(messages.remove)}</span>
            </Button>
          </div>
        )}
        <Tooltip content={intl.formatMessage(messages.enable)}>
          <div>
            <SlideCheckbox
              onClick={() => {
                onEnable();
              }}
              checked={slider.enabled}
            />
          </div>
        </Tooltip>
      </div>
      <div
        className={`pointer-events-none p-4 ${
          !slider.enabled ? 'opacity-50' : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default DiscoverSliderEdit;
