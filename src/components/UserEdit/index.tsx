import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LoadingSpinner from '../Common/LoadingSpinner';
import { useUser } from '../../hooks/useUser';
import Button from '../Common/Button';
import { useIntl, defineMessages, FormattedMessage } from 'react-intl';
import axios from 'axios';
import { useToasts } from 'react-toast-notifications';
import Header from '../Common/Header';
import PermissionEdit from '../PermissionEdit';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import { UserType } from '../../../server/constants/user';

export const messages = defineMessages({
  edituser: 'Edit User',
  plexUsername: 'Plex Username',
  username: 'Display Name',
  avatar: 'Avatar',
  email: 'Email',
  permissions: 'Permissions',
  save: 'Save Changes',
  saving: 'Saving…',
  usersaved: 'User saved!',
  userfail: 'Something went wrong while saving the user.',
});

const UserEdit: React.FC = () => {
  const router = useRouter();
  const intl = useIntl();
  const { addToast } = useToasts();
  const { user: currentUser } = useUser();
  const { user, error, revalidate } = useUser({
    id: Number(router.query.userId),
  });
  const [currentPermission, setCurrentPermission] = useState(0);

  useEffect(() => {
    if (currentPermission !== user?.permissions ?? 0) {
      setCurrentPermission(user?.permissions ?? 0);
    }
    // We know what we are doing here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user && !error) {
    return <LoadingSpinner />;
  }

  const UserEditSchema = Yup.object().shape({
    username: Yup.string(),
  });

  return (
    <Formik
      initialValues={{
        plexUsername: user?.plexUsername,
        username: user?.username,
        email: user?.email,
      }}
      validationSchema={UserEditSchema}
      onSubmit={async (values) => {
        try {
          await axios.put(`/api/v1/user/${user?.id}`, {
            permissions: currentPermission,
            email: user?.email,
            username: values.username,
          });
          addToast(intl.formatMessage(messages.usersaved), {
            appearance: 'success',
            autoDismiss: true,
          });
        } catch (e) {
          addToast(intl.formatMessage(messages.userfail), {
            appearance: 'error',
            autoDismiss: true,
          });
          throw new Error(
            `Something went wrong while saving the user: ${e.message}`
          );
        } finally {
          revalidate();
        }
      }}
    >
      {({ isSubmitting, handleSubmit }) => (
        <Form>
          <div>
            <div className="flex flex-col justify-between sm:flex-row">
              <Header>
                <FormattedMessage {...messages.edituser} />
              </Header>
            </div>
            {user?.userType === UserType.PLEX && (
              <div className="form-row">
                <label htmlFor="plexUsername" className="text-label">
                  {intl.formatMessage(messages.plexUsername)}
                </label>
                <div className="form-input">
                  <div className="flex max-w-lg rounded-md shadow-sm">
                    <Field
                      id="plexUsername"
                      name="plexUsername"
                      type="text"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="form-row">
              <label htmlFor="username" className="text-label">
                {intl.formatMessage(messages.username)}
              </label>
              <div className="form-input">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <Field id="username" name="username" type="text" />
                </div>
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="email" className="text-label">
                <FormattedMessage {...messages.email} />
              </label>
              <div className="form-input">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <Field id="email" name="email" type="text" readOnly />
                </div>
              </div>
            </div>
            <div className="form-row">
              <span className="text-label">
                <FormattedMessage {...messages.avatar} />
              </span>
              <div className="form-input">
                <div className="flex max-w-lg rounded-md shadow-sm">
                  <img
                    className="w-40 h-40 rounded-full"
                    src={user?.avatar}
                    alt=""
                  />
                </div>
              </div>
            </div>
          </div>
          <div role="group" aria-labelledby="group-label" className="group">
            <div className="form-row">
              <span id="group-label" className="group-label">
                <FormattedMessage {...messages.permissions} />
              </span>
              <div className="form-input">
                <div className="max-w-lg">
                  <PermissionEdit
                    user={currentUser}
                    currentPermission={currentPermission}
                    onUpdate={(newPermission) =>
                      setCurrentPermission(newPermission)
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
                  onClick={() => handleSubmit}
                >
                  {isSubmitting
                    ? intl.formatMessage(messages.saving)
                    : intl.formatMessage(messages.save)}
                </Button>
              </span>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default UserEdit;
