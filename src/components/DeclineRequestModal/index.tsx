import Modal from '@app/components/Common/Modal';
import globalMessages from '@app/i18n/globalMessages';
import { Transition } from '@headlessui/react';
import type { MovieDetails } from '@server/models/Movie';
import { Field, Form, Formik } from 'formik';
import React from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';
import * as Yup from 'yup';

interface DeclineRequestModalProps {
  show: boolean;
  tmdbId: number;
  onDecline: (declineMessage: string) => void;
  onCancel?: () => void;
}

const validationSchema = Yup.object().shape({
  declineMessage: Yup.string().max(140, 'Message is too long'),
});

const DeclineRequestModal = ({
  show,
  tmdbId,
  onDecline,
  onCancel,
}: DeclineRequestModalProps) => {
  const intl = useIntl();
  const { data, error } = useSWR<MovieDetails>(`/api/v1/movie/${tmdbId}`, {
    revalidateOnMount: true,
  });
  const [characterCount, setCharacterCount] = React.useState(0);
  const handleCancel = () => {
    setCharacterCount(0);
    if (onCancel) {
      onCancel();
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
      show={show}
    >
      <Formik
        initialValues={{ declineMessage: '' }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          setSubmitting(true);
          onDecline(values.declineMessage);
        }}
      >
        {({ errors, touched, handleSubmit, setFieldValue, values }) => {
          const handleInputChange = (
            event: React.ChangeEvent<HTMLTextAreaElement>
          ) => {
            const { value } = event.target;
            setFieldValue('declineMessage', value);
            setCharacterCount(value.length);
          };

          return (
            <Modal
              loading={!data && !error}
              title="Decline Request"
              subTitle={data?.title}
              onCancel={handleCancel}
              onOk={() => {
                handleSubmit();
              }}
              okText={intl.formatMessage(globalMessages.decline)}
              okButtonType="danger"
              cancelText={intl.formatMessage(globalMessages.cancel)}
              backdrop={`https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/${data?.backdropPath}`}
            >
              <Form>
                <Field
                  name="declineMessage"
                  as="textarea"
                  placeholder="Optional decline message"
                  onChange={handleInputChange}
                  value={values.declineMessage}
                />
                {errors.declineMessage && touched.declineMessage ? (
                  <div className="pt-2 text-red-500">
                    {errors.declineMessage}
                  </div>
                ) : null}
                <div
                  className={`pt-2 text-xs font-light ${
                    characterCount > 140 ? 'text-red-500' : 'text-gray-300'
                  }`}
                >
                  {characterCount}/140
                </div>
              </Form>
            </Modal>
          );
        }}
      </Formik>
    </Transition>
  );
};

export default DeclineRequestModal;
