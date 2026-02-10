import Button from '@app/components/Common/Button';
import Modal from '@app/components/Common/Modal';
import { RadioGroup } from '@headlessui/react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import type { MovieDetails } from '@server/models/Movie';
import type { TvDetails, SeasonWithEpisodes } from '@server/models/Tv';
import axios from 'axios';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';

const messages = defineMessages({
  redownload: 'Re-Download',
  redownloadmovie: 'Re-Download Movie',
  redownloadtv: 'Re-Download',
  confirmredownload: 'Confirm Re-Download',
  movieredownloaddescription:
    'This will trigger a search for this movie. Continue?',
  tvredownloaddescription: 'Select what you want to re-download:',
  entireseries: 'Entire Series',
  selectseason: 'Select Season',
  selectepisodes: 'Select Episodes',
  season: 'Season {seasonNumber}',
  episode: 'Episode {episodeNumber}: {episodeName}',
  toastSuccessMovie: 'Movie re-download initiated successfully!',
  toastSuccessSeries: 'Series re-download initiated successfully!',
  toastSuccessSeason: 'Season re-download initiated successfully!',
  toastSuccessEpisodes: 'Episode re-download initiated successfully!',
  toastFailed: 'Something went wrong while initiating re-download.',
  cancel: 'Cancel',
  noseasons: 'No seasons available.',
  noepisodes: 'No episodes available for this season.',
});

const isMovie = (media: MovieDetails | TvDetails): media is MovieDetails => {
  return (media as MovieDetails).title !== undefined;
};

interface ReDownloadModalContentProps {
  mediaType: 'movie' | 'tv';
  tmdbId: number;
  mediaId: number;
  onCancel: () => void;
  is4k?: boolean;
}

const ReDownloadModalContent = ({
  onCancel,
  mediaType,
  tmdbId,
  mediaId,
  is4k = false,
}: ReDownloadModalContentProps) => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<
    'series' | 'season' | 'episodes'
  >('series');
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisodes, setSelectedEpisodes] = useState<number[]>([]);

  const { data: mediaData } = useSWR<MovieDetails | TvDetails>(
    tmdbId ? `/api/v1/${mediaType}/${tmdbId}` : null
  );

  const { data: seasonData } = useSWR<SeasonWithEpisodes>(
    mediaType === 'tv' && selectedOption === 'episodes'
      ? `/api/v1/tv/${tmdbId}/season/${selectedSeason}`
      : null
  );

  if (!tmdbId || !mediaId) {
    return null;
  }

  const availableSeasons =
    mediaType === 'tv' && mediaData && !isMovie(mediaData)
      ? (mediaData.seasons ?? [])
          .filter((season) => season.seasonNumber > 0)
          .map((season) => season.seasonNumber)
      : [];

  const handleReDownload = async () => {
    setIsSubmitting(true);

    try {
      const payload: {
        is4k?: boolean;
        seasons?: number[];
        episodeIds?: number[];
      } = { is4k };

      if (mediaType === 'tv') {
        if (selectedOption === 'season') {
          payload.seasons = [selectedSeason];
        } else if (selectedOption === 'episodes') {
          payload.episodeIds = selectedEpisodes;
        }
        // For 'series', we don't add any additional fields
      }

      await axios.post(`/api/v1/media/${mediaId}/redownload`, payload);

      let successMessage = messages.toastSuccessMovie;
      if (mediaType === 'tv') {
        if (selectedOption === 'season') {
          successMessage = messages.toastSuccessSeason;
        } else if (selectedOption === 'episodes') {
          successMessage = messages.toastSuccessEpisodes;
        } else {
          successMessage = messages.toastSuccessSeries;
        }
      }

      addToast(intl.formatMessage(successMessage), {
        appearance: 'success',
        autoDismiss: true,
      });

      onCancel();
    } catch (e) {
      addToast(intl.formatMessage(messages.toastFailed), {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEpisode = (episodeId: number) => {
    if (selectedEpisodes.includes(episodeId)) {
      setSelectedEpisodes(selectedEpisodes.filter((id) => id !== episodeId));
    } else {
      setSelectedEpisodes([...selectedEpisodes, episodeId]);
    }
  };

  return (
    <Modal
      title={intl.formatMessage(
        mediaType === 'movie' ? messages.redownloadmovie : messages.redownloadtv
      )}
      onCancel={onCancel}
      onOk={handleReDownload}
      okText={intl.formatMessage(messages.confirmredownload)}
      okDisabled={
        isSubmitting ||
        (mediaType === 'tv' &&
          selectedOption === 'episodes' &&
          selectedEpisodes.length === 0)
      }
      iconSvg={<ArrowPathIcon />}
    >
      {mediaType === 'movie' ? (
        <div className="prose prose-invert">
          <p>{intl.formatMessage(messages.movieredownloaddescription)}</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          <p className="text-sm text-gray-300">
            {intl.formatMessage(messages.tvredownloaddescription)}
          </p>

          <RadioGroup value={selectedOption} onChange={setSelectedOption}>
            <div className="space-y-2">
              <RadioGroup.Option value="series">
                {({ checked }) => (
                  <div
                    className={`cursor-pointer rounded-md border-2 p-3 ${
                      checked
                        ? 'border-indigo-500 bg-indigo-900 bg-opacity-30'
                        : 'border-gray-600 bg-gray-800'
                    }`}
                  >
                    <RadioGroup.Label className="font-medium">
                      {intl.formatMessage(messages.entireseries)}
                    </RadioGroup.Label>
                  </div>
                )}
              </RadioGroup.Option>

              <RadioGroup.Option value="season">
                {({ checked }) => (
                  <div
                    className={`cursor-pointer rounded-md border-2 p-3 ${
                      checked
                        ? 'border-indigo-500 bg-indigo-900 bg-opacity-30'
                        : 'border-gray-600 bg-gray-800'
                    }`}
                  >
                    <RadioGroup.Label className="font-medium">
                      {intl.formatMessage(messages.selectseason)}
                    </RadioGroup.Label>
                    {checked && availableSeasons.length > 0 && (
                      <div className="mt-2">
                        <select
                          value={selectedSeason}
                          onChange={(e) =>
                            setSelectedSeason(Number(e.target.value))
                          }
                          className="w-full rounded-md border-gray-600 bg-gray-700 text-white"
                        >
                          {availableSeasons.map((seasonNum) => (
                            <option key={seasonNum} value={seasonNum}>
                              {intl.formatMessage(messages.season, {
                                seasonNumber: seasonNum,
                              })}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {checked && availableSeasons.length === 0 && (
                      <div className="mt-2 text-sm text-gray-400">
                        {intl.formatMessage(messages.noseasons)}
                      </div>
                    )}
                  </div>
                )}
              </RadioGroup.Option>

              <RadioGroup.Option value="episodes">
                {({ checked }) => (
                  <div
                    className={`cursor-pointer rounded-md border-2 p-3 ${
                      checked
                        ? 'border-indigo-500 bg-indigo-900 bg-opacity-30'
                        : 'border-gray-600 bg-gray-800'
                    }`}
                  >
                    <RadioGroup.Label className="font-medium">
                      {intl.formatMessage(messages.selectepisodes)}
                    </RadioGroup.Label>
                    {checked && availableSeasons.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <select
                          value={selectedSeason}
                          onChange={(e) => {
                            setSelectedSeason(Number(e.target.value));
                            setSelectedEpisodes([]);
                          }}
                          className="w-full rounded-md border-gray-600 bg-gray-700 text-white"
                        >
                          {availableSeasons.map((seasonNum) => (
                            <option key={seasonNum} value={seasonNum}>
                              {intl.formatMessage(messages.season, {
                                seasonNumber: seasonNum,
                              })}
                            </option>
                          ))}
                        </select>
                        {seasonData && (
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {seasonData.episodes.map((episode) => (
                              <label
                                key={episode.id}
                                className="flex items-center space-x-2 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedEpisodes.includes(episode.id)}
                                  onChange={() => toggleEpisode(episode.id)}
                                  className="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>
                                  {intl.formatMessage(messages.episode, {
                                    episodeNumber: episode.episodeNumber,
                                    episodeName: episode.name,
                                  })}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                        {!seasonData && (
                          <div className="text-sm text-gray-400">
                            Loading episodes...
                          </div>
                        )}
                      </div>
                    )}
                    {checked && availableSeasons.length === 0 && (
                      <div className="mt-2 text-sm text-gray-400">
                        {intl.formatMessage(messages.noseasons)}
                      </div>
                    )}
                  </div>
                )}
              </RadioGroup.Option>
            </div>
          </RadioGroup>
        </div>
      )}
    </Modal>
  );
};

export default ReDownloadModalContent;
