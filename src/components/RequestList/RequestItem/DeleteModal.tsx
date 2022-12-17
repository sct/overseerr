import Modal from '@app/components/Common/Modal';
import globalMessages from '@app/i18n/globalMessages';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { defineMessages, useIntl } from 'react-intl';
import * as Yup from 'yup';

interface DeleteProps {
  selectedRequestId: number;
  onCancel: () => void;
  onComplete: () => void;
}

const DeleteModal = ({
  selectedRequestId,
  onCancel,
  onComplete,
}: DeleteProps) => {
  const intl = useIntl();

  const messages = defineMessages({
    deleterequest: 'Delete Request',
    requestdeleted: 'Request deleted successfully!',
    requestdeleteerror: 'Something went wrong while deleting the request.',
    blacklistmedia: 'Blacklist this media to prevent future requests',
    deleteconfirm: 'Are you sure you want to delete this request ?',
  });

  const DeleteRequestSchema = Yup.object().shape({
    blacklistMedia: Yup.boolean().required('Required'),
  });

  return (
    <Formik
      initialValues={{
        blacklistMedia: false,
      }}
      validationSchema={DeleteRequestSchema}
      onSubmit={async (values) => {
        await axios.delete(
          `/api/v1/request/${selectedRequestId}?blacklistMedia=${values.blacklistMedia}`
        );

        onComplete();
        // revalidateList();
      }}
    >
      {({
        // errors,
        // touched,
        isSubmitting,
        // values,
        isValid,
        // setFieldValue,
        handleSubmit,
      }) => {
        return (
          <Modal
            title={intl.formatMessage(messages.deleterequest)}
            onOk={() => handleSubmit()}
            okText={
              isSubmitting
                ? intl.formatMessage(globalMessages.deleting)
                : intl.formatMessage(globalMessages.delete)
            }
            okDisabled={isSubmitting || !isValid}
            okButtonType="danger"
            onCancel={onCancel}
          >
            <Form>
              <div className="flex flex-row items-center gap-4">
                <Field
                  type="checkbox"
                  id="blacklistMedia"
                  name="blacklistMedia"
                />
                <label htmlFor="blacklistMedia" className="checkbox-label">
                  {intl.formatMessage(messages.blacklistmedia)}
                </label>
              </div>
            </Form>
          </Modal>
        );
      }}
    </Formik>
  );
};

export default DeleteModal;
