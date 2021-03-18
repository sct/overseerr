import React from 'react';
import useSWR from 'swr';
import LoadingSpinner from '../../Common/LoadingSpinner';
import type { MainSettings } from '../../../../server/lib/settings';
import { Form, Formik, Field } from 'formik';
import axios from 'axios';
import Button from '../../Common/Button';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import PermissionEdit from '../../PermissionEdit';
import PageTitle from '../../Common/PageTitle';
import globalMessages from '../../../i18n/globalMessages';

const messages = defineMessages({
  users: 'Users',
  userSettings: 'User Settings',
  userSettingsDescription: 'Configure global and default user settings.',
  save: 'Save Changes',
  saving: 'Saving…',
  toastSettingsSuccess: 'User settings saved successfully!',
  toastSettingsFailure: 'Something went wrong while saving settings.',
  localLogin: 'Enable Local User Sign-In',
  defaultPermissions: 'Default User Permissions',
});

const SettingsUsers: React.FC = () => {
  const { addToast } = useToasts();
  const intl = useIntl();
  const { data, error, revalidate } = useSWR<MainSettings>(
    '/api/v1/settings/main'
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.users),
          intl.formatMessage(globalMessages.settings),
        ]}
      />
      <div className="mb-6">
        <h3 className="heading">{intl.formatMessage(messages.userSettings)}</h3>
        <p className="description">
          {intl.formatMessage(messages.userSettingsDescription)}
        </p>
      </div>
      <div className="section">
        <Formik
          initialValues={{
            localLogin: data?.localLogin,
            defaultPermissions: data?.defaultPermissions ?? 0,
          }}
          enableReinitialize
          onSubmit={async (values) => {
            try {
              await axios.post('/api/v1/settings/main', {
                localLogin: values.localLogin,
                defaultPermissions: values.defaultPermissions,
              });

              addToast(intl.formatMessage(messages.toastSettingsSuccess), {
                autoDismiss: true,
                appearance: 'success',
              });
            } catch (e) {
              addToast(intl.formatMessage(messages.toastSettingsFailure), {
                autoDismiss: true,
                appearance: 'error',
              });
            } finally {
              revalidate();
            }
          }}
        >
          {({ isSubmitting, values, setFieldValue }) => {
            return (
              <Form className="section">
                <div className="form-row">
                  <label htmlFor="localLogin" className="checkbox-label">
                    <span>{intl.formatMessage(messages.localLogin)}</span>
                  </label>
                  <div className="form-input">
                    <Field
                      type="checkbox"
                      id="localLogin"
                      name="localLogin"
                      onChange={() => {
                        setFieldValue('localLogin', !values.localLogin);
                      }}
                    />
                  </div>
                </div>
                <div
                  role="group"
                  aria-labelledby="group-label"
                  className="form-group"
                >
                  <div className="form-row">
                    <span id="group-label" className="group-label">
                      {intl.formatMessage(messages.defaultPermissions)}
                    </span>
                    <div className="form-input">
                      <div className="max-w-lg">
                        <PermissionEdit
                          currentPermission={values.defaultPermissions}
                          onUpdate={(newPermissions) =>
                            setFieldValue('defaultPermissions', newPermissions)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="actions">
                  <div className="flex justify-end">
                    <span className="inline-flex ml-3 rounded-md shadow-sm">
                      <Button
                        buttonType="primary"
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting
                          ? intl.formatMessage(messages.saving)
                          : intl.formatMessage(messages.save)}
                      </Button>
                    </span>
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </>
  );
};

export default SettingsUsers;
