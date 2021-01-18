import React from 'react';
import { Field, Form, Formik } from 'formik';
import Alert from '../../Common/Alert';
import Modal from '../../Common/Modal';
import useSWR from 'swr';
import { defineMessages, useIntl } from 'react-intl';
import { SearchResult } from '../../../../server/api/tvdb';

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
  const { data, error } = useSWR<{ result: SearchResult[] }>(
    `/api/v1/service/sonarr/lookup/${tmdbId}`
  );

  console.log(data);
  return (
    <Formik
      initialValues={{
        tvdbId: 0,
      }}
      onSubmit={(values) => {
        setTvdbId(values.tvdbId);
        closeModal();
      }}
    >
      {({
        // errors,
        // touched,
        isSubmitting,
        values,
        // isValid,
        // setFieldValue,
        handleSubmit,
      }) => {
        return (
          <Modal
            loading={loading && !error}
            backgroundClickable
            onCancel={onCancel}
            onOk={() => handleSubmit()}
            title={modalTitle}
            okText={intl.formatMessage(messages.next)}
            okDisabled={isSubmitting || !values.tvdbId}
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
            <Form>
              <div role="group" aria-labelledby="tvdb-group">
                {/* {data?.result.map((show) => (
                  <>
                    <div className="p-1" key={show.tvdbId}>
                      <label className="block text-sm font-medium leading-5 sm:mt-px">
                        <Field
                          id="tvdbId"
                          name="tvdbId"
                          type="radio"
                          value={String(show.tvdbId)}
                          className="w-6 h-6 mr-2 text-indigo-600 transition duration-150 ease-in-out rounded-full form-radio"
                        />

                        {show.mediaName + (show.year ? ` (${show.year})` : '')}
                      </label>
                    </div>
                    <div className="p-1">
                      <label className="block text-sm font-medium leading-5 sm:mt-px">
                        <Field
                          id="tvdbId"
                          name="tvdbId"
                          type="radio"
                          value={String(show.tvdbId)}
                          className="w-6 h-6 mr-2 text-indigo-600 transition duration-150 ease-in-out rounded-full form-radio"
                        />
                        {'Some other title (1337)'}
                      </label>
                    </div>
                  </>
                ))} */}
              </div>
            </Form>
          </Modal>
        );
      }}
    </Formik>
  );
};

export default SearchByNameModal;
