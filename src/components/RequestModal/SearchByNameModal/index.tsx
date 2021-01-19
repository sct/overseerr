import React from 'react';
import Alert from '../../Common/Alert';
import Modal from '../../Common/Modal';
import useSWR from 'swr';
import { defineMessages, useIntl } from 'react-intl';
import { SonarrSeries } from '../../../../server/api/sonarr';

const messages = defineMessages({
  next: 'Next',
  notvdbid: 'No TVDB id was found connected on TMDB',
  notvdbiddescription:
    'Either add the TVDB id to TMDB and come back later, or select the correct match below.',
  nosummary: 'No summary for this title was found.',
});

interface SearchByNameModalProps {
  setTvdbId: (id: number) => void;
  tvdbId: number | undefined;
  loading: boolean;
  onCancel?: () => void;
  closeModal: () => void;
  modalTitle: string;
  tmdbId: number;
}

const SearchByNameModal: React.FC<SearchByNameModalProps> = ({
  setTvdbId,
  tvdbId,
  loading,
  onCancel,
  closeModal,
  modalTitle,
  tmdbId,
}) => {
  const intl = useIntl();
  const { data, error } = useSWR<SonarrSeries[]>(
    `/api/v1/service/sonarr/lookup/${tmdbId}`
  );

  const handleClick = (tvdbId: number) => {
    setTvdbId(tvdbId);
  };

  return (
    <Modal
      loading={loading && !error}
      backgroundClickable
      onCancel={onCancel}
      onOk={closeModal}
      title={modalTitle}
      okText={intl.formatMessage(messages.next)}
      okDisabled={!tvdbId}
      okButtonType="primary"
      iconSvg={
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      }
    >
      <Alert title={intl.formatMessage(messages.notvdbid)} type="info">
        {intl.formatMessage(messages.notvdbiddescription)}
      </Alert>
      <div className="grid md:grid-cols-2 grid-cols-1 gap-4 pb-2">
        {data?.slice(0, 6).map((item) => (
          <div
            key={item.tvdbId}
            className="h-40 transition duration-300 transform-gpu scale-100 container mx-auto flex flex-col space-y-4 justify-center items-center hover:scale-105 outline-none "
            onClick={() => handleClick(item.tvdbId)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Space') {
                handleClick(item.tvdbId);
                e.preventDefault();
              }
            }}
            role="link"
            tabIndex={0}
          >
            <div
              className={`border bg-gray-600 h-40 overflow-hidden w-full flex items-center p-2 rounded-xl shadow ${
                tvdbId === item.tvdbId ? '' : 'border-transparent'
              } `}
            >
              <div className="flex-none flex items-center space-x-4 w-24">
                <img
                  src={
                    item.remotePoster ??
                    '/images/overseerr_poster_not_found.png'
                  }
                  alt={item.title}
                  className="w-auto h-100 rounded-xl"
                />
              </div>
              <div className="flex-grow p-3 self-start">
                <div className="text-sm font-medium text-grey-200">
                  {item.title}
                </div>
                <div className="text-sm text-gray-400 h-24 overflow-hidden">
                  {item.overview ?? intl.formatMessage(messages.nosummary)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default SearchByNameModal;
