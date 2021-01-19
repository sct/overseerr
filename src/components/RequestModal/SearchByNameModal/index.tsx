import React, { useRef, Fragment } from 'react';
import { Field, Form, Formik } from 'formik';
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
});

interface SearchByNameModalProps {
  setTvdbId: (id: number) => void;
  loading: boolean;
  onCancel?: () => void;
  closeModal: () => void;
  modalTitle: string;
  tmdbId: number;
}

const SearchByNameModal: React.FC<SearchByNameModalProps> = ({
  setTvdbId,
  loading,
  onCancel,
  closeModal,
  modalTitle,
  tmdbId,
}) => {
  const intl = useIntl();
  const { data, error } = useSWR<SonarrSeries[]>(
    `/api/v1/service/sonarr/lookup/121`
    // `/api/v1/service/sonarr/lookup/${tmdbId}`
  );
  const selectedShow = useRef<number | null>(null);

  const handleClick = (tvdbId: number) => {
    selectedShow.current = tvdbId;
  };

  return (
    <Modal
      loading={loading && !error}
      backgroundClickable
      onCancel={onCancel}
      onOk={() => null}
      title={modalTitle}
      okText={intl.formatMessage(messages.next)}
      okDisabled={!selectedShow.current}
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
      <div>
        {data?.map((item) => (
          <Fragment key={item.id}>
            <div className="container mx-auto flex flex-col space-y-4 justify-center items-center h-72 overflow-hidden">
              <div className="bg-gray-600  w-full flex items-center p-2 m-2 rounded-xl shadow">
                <div className="flex-none flex items-center space-x-4 w-32 md:w-44 lg:w-52">
                  <img
                    src={item.remotePoster}
                    alt={item.title}
                    className="w-auto h-100 rounded-xl"
                  />
                </div>
                <div className="flex-grow p-3 self-start">
                  <div className="text-sm font-medium text-grey-200">
                    {item.title}
                  </div>
                  <div className="text-sm text-gray-400 max-h-52 overflow-x-scroll">
                    {item.overview}
                  </div>
                </div>
              </div>
            </div>
          </Fragment>
        ))}
      </div>
    </Modal>
  );
};

export default SearchByNameModal;
