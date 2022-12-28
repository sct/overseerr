import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import Tooltip from '@app/components/Common/Tooltip';
import { sliderTitles } from '@app/components/Discover/constants';
import CreateSlider from '@app/components/Settings/SettingsMain/DiscoverCustomization/CreateSlider';
import DiscoverOption from '@app/components/Settings/SettingsMain/DiscoverCustomization/DiscoverOption';
import globalMessages from '@app/i18n/globalMessages';
import { RefreshIcon, SaveIcon } from '@heroicons/react/solid';
import { DiscoverSliderType } from '@server/constants/discover';
import type DiscoverSlider from '@server/entity/DiscoverSlider';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';

const messages = defineMessages({
  resettodefault: 'Reset to Default',
  resetwarning:
    'Reset all sliders to default. This will also delete any custom sliders!',
  updatesuccess: 'Updated discover customization settings.',
  updatefailed:
    'Something went wrong updating the discover customization settings.',
  resetsuccess: 'Sucessfully reset discover customization settings.',
  resetfailed:
    'Something went wrong resetting the discover customization settings.',
});

const DiscoverCustomization = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { data, error, mutate } = useSWR<DiscoverSlider[]>(
    '/api/v1/settings/discover'
  );
  const [sliders, setSliders] = useState<Partial<DiscoverSlider>[]>([]);

  // We need to sync the state here so that we can modify the changes locally without commiting
  // anything to the server until the user decides to save the changes
  useEffect(() => {
    if (data) {
      setSliders(data);
    }
  }, [data]);

  const updateSliders = async () => {
    try {
      await axios.post('/api/v1/settings/discover', sliders);

      addToast(intl.formatMessage(messages.updatesuccess), {
        appearance: 'success',
        autoDismiss: true,
      });
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
      mutate();
    } catch (e) {
      addToast(intl.formatMessage(messages.resetfailed), {
        appearance: 'error',
        autoDismiss: true,
      });
    }
  };

  const hasChanged = () => !Object.is(data, sliders);

  const getSliderTitle = (slider: Partial<DiscoverSlider>): string => {
    if (slider.title) {
      return slider.title;
    }

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
      default:
        return 'Unknown Slider';
    }
  };

  const getSliderSubtitle = (
    slider: Partial<DiscoverSlider>
  ): string | undefined => {
    switch (slider.type) {
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
        return undefined;
    }
  };

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <div className="section">
        <div className="flex flex-col space-y-2 rounded border border-gray-700 p-2">
          {sliders.map((slider, index) => (
            <DiscoverOption
              id={slider.id ?? -1}
              key={slider.id ?? `no-id-${index}`}
              title={getSliderTitle(slider)}
              subtitle={getSliderSubtitle(slider)}
              data={slider.data}
              enabled={slider.enabled}
              isBuiltIn={slider.isBuiltIn}
              onDelete={() => {
                mutate();
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
            />
          ))}
          <CreateSlider
            onCreate={() => {
              mutate();
            }}
          />
        </div>
      </div>
      <div className="actions">
        <div className="flex justify-end">
          <span className="ml-3 inline-flex rounded-md shadow-sm">
            <Tooltip content={intl.formatMessage(messages.resetwarning)}>
              <Button buttonType="default" onClick={() => resetSliders()}>
                <RefreshIcon />
                <span>{intl.formatMessage(messages.resettodefault)}</span>
              </Button>
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
              <SaveIcon />
              <span>{intl.formatMessage(globalMessages.save)}</span>
            </Button>
          </span>
        </div>
      </div>
    </>
  );
};

export default DiscoverCustomization;
