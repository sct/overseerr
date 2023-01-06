import Button from '@app/components/Common/Button';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import Tooltip from '@app/components/Common/Tooltip';
import { sliderTitles } from '@app/components/Discover/constants';
import CreateSlider from '@app/components/Discover/CreateSlider';
import DiscoverSliderEdit from '@app/components/Discover/DiscoverSliderEdit';
import MovieGenreSlider from '@app/components/Discover/MovieGenreSlider';
import NetworkSlider from '@app/components/Discover/NetworkSlider';
import PlexWatchlistSlider from '@app/components/Discover/PlexWatchlistSlider';
import RecentlyAddedSlider from '@app/components/Discover/RecentlyAddedSlider';
import RecentRequestsSlider from '@app/components/Discover/RecentRequestsSlider';
import StudioSlider from '@app/components/Discover/StudioSlider';
import TvGenreSlider from '@app/components/Discover/TvGenreSlider';
import MediaSlider from '@app/components/MediaSlider';
import { encodeURIExtraParams } from '@app/hooks/useSearchInput';
import { Permission, useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import {
  ArrowDownOnSquareIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  PencilIcon,
  PlusIcon,
} from '@heroicons/react/24/solid';
import { DiscoverSliderType } from '@server/constants/discover';
import type DiscoverSlider from '@server/entity/DiscoverSlider';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';

const messages = defineMessages({
  discover: 'Discover',
  emptywatchlist:
    'Media added to your <PlexWatchlistSupportLink>Plex Watchlist</PlexWatchlistSupportLink> will appear here.',
  resettodefault: 'Reset to Default',
  resetwarning:
    'Reset all sliders to default. This will also delete any custom sliders!',
  updatesuccess: 'Updated discover customization settings.',
  updatefailed:
    'Something went wrong updating the discover customization settings.',
  resetsuccess: 'Sucessfully reset discover customization settings.',
  resetfailed:
    'Something went wrong resetting the discover customization settings.',
  customizediscover: 'Customize Discover',
  stopediting: 'Stop Editing',
  createnewslider: 'Create New Slider',
});

const Discover = () => {
  const intl = useIntl();
  const { hasPermission } = useUser();
  const { addToast } = useToasts();
  const {
    data: discoverData,
    error: discoverError,
    mutate,
  } = useSWR<DiscoverSlider[]>('/api/v1/settings/discover');
  const [sliders, setSliders] = useState<Partial<DiscoverSlider>[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // We need to sync the state here so that we can modify the changes locally without commiting
  // anything to the server until the user decides to save the changes
  useEffect(() => {
    if (discoverData && !isEditing) {
      setSliders(discoverData);
    }
  }, [discoverData, isEditing]);

  const hasChanged = () => !Object.is(discoverData, sliders);

  const updateSliders = async () => {
    try {
      await axios.post('/api/v1/settings/discover', sliders);

      addToast(intl.formatMessage(messages.updatesuccess), {
        appearance: 'success',
        autoDismiss: true,
      });
      setIsEditing(false);
      mutate();
    } catch (e) {
      addToast(intl.formatMessage(messages.updatefailed), {
        appearance: 'error',
        autoDismiss: true,
      });
    }
  };

  const resetSliders = async () => {
    try {
      await axios.get('/api/v1/settings/discover/reset');

      addToast(intl.formatMessage(messages.resetsuccess), {
        appearance: 'success',
        autoDismiss: true,
      });
      setIsEditing(false);
      mutate();
    } catch (e) {
      addToast(intl.formatMessage(messages.resetfailed), {
        appearance: 'error',
        autoDismiss: true,
      });
    }
  };

  if (!discoverData && !discoverError) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <PageTitle title={intl.formatMessage(messages.discover)} />
      {hasPermission(Permission.ADMIN) && (
        <>
          {isEditing ? (
            <>
              <div className="my-6 flex justify-end">
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="default"
                    onClick={() => setIsEditing(false)}
                  >
                    <ArrowUturnLeftIcon />
                    <span>{intl.formatMessage(messages.stopediting)}</span>
                  </Button>
                </span>
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Tooltip content={intl.formatMessage(messages.resetwarning)}>
                    <ConfirmButton
                      onClick={() => resetSliders()}
                      confirmText={intl.formatMessage(
                        globalMessages.areyousure
                      )}
                    >
                      <ArrowPathIcon />
                      <span>{intl.formatMessage(messages.resettodefault)}</span>
                    </ConfirmButton>
                  </Tooltip>
                </span>
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="primary"
                    type="submit"
                    disabled={!hasChanged()}
                    onClick={() => updateSliders()}
                    data-testid="discover-customize-submit"
                  >
                    <ArrowDownOnSquareIcon />
                    <span>{intl.formatMessage(globalMessages.save)}</span>
                  </Button>
                </span>
              </div>
              <div className="mb-6 rounded-lg bg-gray-800">
                <div className="flex items-center space-x-2 border-t border-l border-r border-gray-800 bg-gray-900 p-4 text-lg font-semibold text-gray-400">
                  <PlusIcon className="w-6" />
                  <span data-testid="create-slider-header">
                    {intl.formatMessage(messages.createnewslider)}
                  </span>
                </div>
                <div className="p-4">
                  <CreateSlider
                    onCreate={async () => {
                      const newSliders = await mutate();

                      if (newSliders) {
                        setSliders(newSliders);
                      }
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="my-6 flex justify-end">
              <span className="ml-3 inline-flex rounded-md shadow-sm">
                <Button
                  buttonType="default"
                  onClick={() => setIsEditing(true)}
                  data-testid="discover-start-editing"
                >
                  <PencilIcon />
                  <span>{intl.formatMessage(messages.customizediscover)}</span>
                </Button>
              </span>
            </div>
          )}
        </>
      )}
      {(isEditing ? sliders : discoverData)?.map((slider, index) => {
        let sliderComponent: React.ReactNode;

        switch (slider.type) {
          case DiscoverSliderType.RECENTLY_ADDED:
            sliderComponent = <RecentlyAddedSlider />;
            break;
          case DiscoverSliderType.RECENT_REQUESTS:
            sliderComponent = <RecentRequestsSlider />;
            break;
          case DiscoverSliderType.PLEX_WATCHLIST:
            sliderComponent = <PlexWatchlistSlider />;
            break;
          case DiscoverSliderType.TRENDING:
            sliderComponent = (
              <MediaSlider
                sliderKey="trending"
                title={intl.formatMessage(sliderTitles.trending)}
                url="/api/v1/discover/trending"
                linkUrl="/discover/trending"
              />
            );
            break;
          case DiscoverSliderType.POPULAR_MOVIES:
            sliderComponent = (
              <MediaSlider
                sliderKey="popular-movies"
                title={intl.formatMessage(sliderTitles.popularmovies)}
                url="/api/v1/discover/movies"
                linkUrl="/discover/movies"
              />
            );
            break;
          case DiscoverSliderType.MOVIE_GENRES:
            sliderComponent = <MovieGenreSlider />;
            break;
          case DiscoverSliderType.UPCOMING_MOVIES:
            sliderComponent = (
              <MediaSlider
                sliderKey="upcoming"
                title={intl.formatMessage(sliderTitles.upcoming)}
                linkUrl="/discover/movies/upcoming"
                url="/api/v1/discover/movies/upcoming"
              />
            );
            break;
          case DiscoverSliderType.STUDIOS:
            sliderComponent = <StudioSlider />;
            break;
          case DiscoverSliderType.POPULAR_TV:
            sliderComponent = (
              <MediaSlider
                sliderKey="popular-tv"
                title={intl.formatMessage(sliderTitles.populartv)}
                url="/api/v1/discover/tv"
                linkUrl="/discover/tv"
              />
            );
            break;
          case DiscoverSliderType.TV_GENRES:
            sliderComponent = <TvGenreSlider />;
            break;
          case DiscoverSliderType.UPCOMING_TV:
            sliderComponent = (
              <MediaSlider
                sliderKey="upcoming-tv"
                title={intl.formatMessage(sliderTitles.upcomingtv)}
                url="/api/v1/discover/tv/upcoming"
                linkUrl="/discover/tv/upcoming"
              />
            );
            break;
          case DiscoverSliderType.NETWORKS:
            sliderComponent = <NetworkSlider />;
            break;
          case DiscoverSliderType.TMDB_MOVIE_KEYWORD:
            sliderComponent = (
              <MediaSlider
                sliderKey={`custom-slider-${slider.id}`}
                title={slider.title ?? ''}
                url="/api/v1/discover/movies"
                extraParams={
                  slider.data
                    ? `keywords=${encodeURIExtraParams(slider.data)}`
                    : ''
                }
                linkUrl={`/discover/movies/keyword?keywords=${slider.data}`}
              />
            );
            break;
          case DiscoverSliderType.TMDB_TV_KEYWORD:
            sliderComponent = (
              <MediaSlider
                sliderKey={`custom-slider-${slider.id}`}
                title={slider.title ?? ''}
                url="/api/v1/discover/tv"
                extraParams={
                  slider.data
                    ? `keywords=${encodeURIExtraParams(slider.data)}`
                    : ''
                }
                linkUrl={`/discover/tv/keyword?keywords=${slider.data}`}
              />
            );
            break;
          case DiscoverSliderType.TMDB_MOVIE_GENRE:
            sliderComponent = (
              <MediaSlider
                sliderKey={`custom-slider-${slider.id}`}
                title={slider.title ?? ''}
                url={`/api/v1/discover/movies/genre/${slider.data}`}
                linkUrl={`/discover/movies/genre/${slider.data}`}
              />
            );
            break;
          case DiscoverSliderType.TMDB_TV_GENRE:
            sliderComponent = (
              <MediaSlider
                sliderKey={`custom-slider-${slider.id}`}
                title={slider.title ?? ''}
                url={`/api/v1/discover/tv/genre/${slider.data}`}
                linkUrl={`/discover/tv/genre/${slider.data}`}
              />
            );
            break;
          case DiscoverSliderType.TMDB_STUDIO:
            sliderComponent = (
              <MediaSlider
                sliderKey={`custom-slider-${slider.id}`}
                title={slider.title ?? ''}
                url={`/api/v1/discover/movies/studio/${slider.data}`}
                linkUrl={`/discover/movies/studio/${slider.data}`}
              />
            );
            break;
          case DiscoverSliderType.TMDB_NETWORK:
            sliderComponent = (
              <MediaSlider
                sliderKey={`custom-slider-${slider.id}`}
                title={slider.title ?? ''}
                url={`/api/v1/discover/tv/network/${slider.data}`}
                linkUrl={`/discover/tv/network/${slider.data}`}
              />
            );
            break;
          case DiscoverSliderType.TMDB_SEARCH:
            sliderComponent = (
              <MediaSlider
                sliderKey={`custom-slider-${slider.id}`}
                title={slider.title ?? ''}
                url="/api/v1/search"
                extraParams={`query=${slider.data}`}
                linkUrl={`/search?query=${slider.data}`}
              />
            );
            break;
        }

        if (isEditing) {
          return (
            <DiscoverSliderEdit
              key={`discover-slider-${slider.id}-edit`}
              slider={slider}
              onDelete={async () => {
                const newSliders = await mutate();

                if (newSliders) {
                  setSliders(newSliders);
                }
              }}
              onEnable={() => {
                const tempSliders = sliders.slice();
                tempSliders[index].enabled = !tempSliders[index].enabled;
                setSliders(tempSliders);
              }}
              onPositionUpdate={(updatedItemId, position) => {
                const originalPosition = sliders.findIndex(
                  (item) => item.id === updatedItemId
                );
                const originalItem = sliders[originalPosition];

                const tempSliders = sliders.slice();

                tempSliders.splice(originalPosition, 1);
                tempSliders.splice(
                  position === 'Above' && index > originalPosition
                    ? Math.max(index - 1, 0)
                    : index,
                  0,
                  originalItem
                );

                setSliders(tempSliders);
              }}
            >
              {sliderComponent}
            </DiscoverSliderEdit>
          );
        }

        if (!slider.enabled) {
          return null;
        }

        return (
          <div key={`discover-slider-${slider.id}`} className="mt-6">
            {sliderComponent}
          </div>
        );
      })}
    </>
  );
};

export default Discover;
