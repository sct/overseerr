import Button from '@app/components/Common/Button';
import Modal from '@app/components/Common/Modal';
import { useDeclineReasons } from '@app/hooks/useDeclineReasons';
import globalMessages from '@app/i18n/globalMessages';
import { Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import type { MediaRequest } from '@server/entity/MediaRequest';
import type { MovieDetails } from '@server/models/Movie';
import type { TvDetails } from '@server/models/Tv';
import axios from 'axios';
import type React from 'react';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR, { mutate } from 'swr';

const messages = defineMessages({
  declineRequestTitle: 'Decline Request',
  declineRequest4kTitle: 'Decline 4K Request',
  declineReason: 'Decline Reason',
  customReason: 'Custom Reason',
  customReasonPlaceholder: 'Enter a custom decline reason…',
  declineWithReason: 'Decline With Reason',
  requestDeclined: 'Request for <strong>{title}</strong> declined.',
  errorDeclining: 'Something went wrong while declining the request.',
  presetSaved: 'Decline reason saved as preset.',
  presetSaveFailed: 'Failed to save preset.',
  presetDeleted: 'Preset deleted successfully.',
  presetDeleteFailed: 'Failed to delete preset.',
  removePreset: 'Remove Preset',
  quickReasons: 'Quick Reasons',
  saveAsPresetLabel: 'Save as preset for future use',
});

interface DeclineReasonModalProps {
  request: MediaRequest;
  onCancel: () => void;
  onComplete: () => void;
}

const DeclineReasonModal = ({
  request,
  onCancel,
  onComplete,
}: DeclineReasonModalProps) => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customReason, setCustomReason] = useState('');
  const [saveAsPreset, setSaveAsPreset] = useState(false);
  const { customReasons, addCustomReason, removeCustomReason } =
    useDeclineReasons();

  const { data: mediaData } = useSWR<MovieDetails | TvDetails>(
    request.type === 'movie'
      ? `/api/v1/movie/${request.media.tmdbId}`
      : `/api/v1/tv/${request.media.tmdbId}`
  );

  const isMovie = (media: MovieDetails | TvDetails): media is MovieDetails => {
    return (media as MovieDetails).title !== undefined;
  };

  const getMediaTitle = () => {
    if (!mediaData) return '';
    return isMovie(mediaData) ? mediaData.title : mediaData.name;
  };

  const getMediaYear = () => {
    if (!mediaData) return '';
    const date = isMovie(mediaData)
      ? mediaData.releaseDate
      : mediaData.firstAirDate;
    return date ? ` (${date.slice(0, 4)})` : '';
  };

  const declineWithReason = async (reason: string) => {
    setIsSubmitting(true);

    try {
      await axios.post(`/api/v1/request/${request.id}/decline`, {
        reason: reason.trim(),
      });

      // Immediately revalidate the request data and counts
      mutate(`/api/v1/request/${request.id}`);
      mutate('/api/v1/request/count');

      addToast(
        <span>
          {intl.formatMessage(messages.requestDeclined, {
            title: getMediaTitle(),
            strong: (msg: React.ReactNode) => <strong>{msg}</strong>,
          })}
        </span>,
        { appearance: 'success', autoDismiss: true }
      );

      onComplete();
    } catch (error) {
      addToast(intl.formatMessage(messages.errorDeclining), {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomReasonSubmit = async () => {
    if (customReason.trim()) {
      if (saveAsPreset) {
        try {
          await addCustomReason(customReason.trim());
          addToast(intl.formatMessage(messages.presetSaved), {
            appearance: 'success',
            autoDismiss: true,
          });
        } catch (error) {
          addToast(intl.formatMessage(messages.presetSaveFailed), {
            appearance: 'error',
            autoDismiss: true,
          });
        }
      }

      declineWithReason(customReason);
    }
  };

  const handleDeleteCustomReason = async (reasonId: number) => {
    try {
      await removeCustomReason(reasonId);
      addToast(intl.formatMessage(messages.presetDeleted), {
        appearance: 'success',
        autoDismiss: true,
      });
    } catch (error) {
      addToast(intl.formatMessage(messages.presetDeleteFailed), {
        appearance: 'error',
        autoDismiss: true,
      });
    }
  };

  return (
    <Transition
      as="div"
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      show={true}
    >
      <Modal
        title={intl.formatMessage(
          request.is4k
            ? messages.declineRequest4kTitle
            : messages.declineRequestTitle
        )}
        subTitle={`${getMediaTitle()}${getMediaYear()}`}
        onCancel={onCancel}
        cancelText={intl.formatMessage(globalMessages.cancel)}
        backdrop={
          mediaData &&
          `https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/${
            isMovie(mediaData) ? mediaData.backdropPath : mediaData.backdropPath
          }`
        }
      >
        <div className="space-y-6">
          <div>
            <h3 className="mb-4 text-lg font-medium leading-6 text-gray-100">
              {intl.formatMessage(messages.declineReason)}
            </h3>

            {/* Preset Reasons */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-200">
                {intl.formatMessage(messages.quickReasons)}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {customReasons.map((customReason) => (
                  <div
                    key={customReason.id}
                    className="relative flex items-center rounded-md border border-gray-600 bg-gray-800 transition-colors duration-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500 hover:bg-gray-700"
                  >
                    <button
                      type="button"
                      className="flex flex-grow items-center justify-start px-4 py-3 text-sm font-medium text-gray-300 hover:text-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => declineWithReason(customReason.reason)}
                      disabled={isSubmitting}
                    >
                      {customReason.reason}
                    </button>
                    <button
                      type="button"
                      className="flex-shrink-0 p-2 text-gray-400 hover:text-red-400 focus:outline-none"
                      onClick={() => handleDeleteCustomReason(customReason.id)}
                      title={intl.formatMessage(messages.removePreset)}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Reason */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-200">
              {intl.formatMessage(messages.customReason)}
            </label>
            <div className="space-y-3">
              <textarea
                className="block w-full rounded-md border border-gray-500 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                rows={3}
                placeholder={intl.formatMessage(
                  messages.customReasonPlaceholder
                )}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                disabled={isSubmitting}
              />

              {/* Save as Preset Checkbox */}
              <div className="flex items-center">
                <input
                  id="save-as-preset"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  checked={saveAsPreset}
                  onChange={(e) => setSaveAsPreset(e.target.checked)}
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="save-as-preset"
                  className="ml-2 text-sm text-gray-300"
                >
                  {intl.formatMessage(messages.saveAsPresetLabel)}
                </label>
              </div>

              <Button
                buttonType="danger"
                onClick={handleCustomReasonSubmit}
                disabled={!customReason.trim() || isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting
                  ? intl.formatMessage(globalMessages.declining)
                  : intl.formatMessage(globalMessages.decline)}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </Transition>
  );
};

export default DeclineReasonModal;
