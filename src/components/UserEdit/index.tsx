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
  save: 'Save',
  saving: 'Saving…',
  usersaved: 'User saved',
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
          <Header>
            <FormattedMessage {...messages.edituser} />
          </Header>
          <div className="space-y-6">
            <div className="flex flex-col space-y-6 text-white lg:flex-row lg:space-y-0 lg:space-x-6">
              <div className="flex-grow space-y-6">
                {user?.userType === UserType.PLEX && (
                  <div className="space-y-1">
                    <label
                      htmlFor="plexUsername"
                      className="block text-sm font-medium leading-5 text-gray-400"
                    >
                      {intl.formatMessage(messages.plexUsername)}
                    </label>
                    <div className="flex rounded-md shadow-sm">
                      <Field
                        id="plexUsername"
                        name="plexUsername"
                        type="text"
                        className="flex-grow block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                        readOnly
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium leading-5 text-gray-400"
                  >
                    {intl.formatMessage(messages.username)}
                  </label>
                  <div className="flex rounded-md shadow-sm">
                    <Field
                      id="username"
                      name="username"
                      type="text"
                      className="flex-grow block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium leading-5 text-gray-400"
                  >
                    <FormattedMessage {...messages.email} />
                  </label>
                  <div className="flex rounded-md shadow-sm">
                    <Field
                      id="email"
                      name="email"
                      type="text"
                      className="flex-grow block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="flex-grow space-y-1 lg:flex-grow-0 lg:flex-shrink-0">
                <p
                  className="block text-sm font-medium leading-5 text-gray-400"
                  aria-hidden="true"
                >
                  <FormattedMessage {...messages.avatar} />
                </p>
                <div className="lg:hidden">
                  <div className="flex items-center">
                    <div
                      className="flex-shrink-0 inline-block w-12 h-12 overflow-hidden rounded-full"
                      aria-hidden="true"
                    >
                      <img
                        className="w-full h-full rounded-full"
                        src={user?.avatar}
                        alt=""
                      />
                    </div>
                  </div>
                </div>

                <div className="relative hidden overflow-hidden transition duration-150 ease-in-out rounded-full lg:block">
                  <img
                    className="relative w-40 h-40 rounded-full"
                    src={user?.avatar}
                    alt=""
                  />
                </div>
              </div>
            </div>
            <div className="text-white">
              <div className="sm:border-t sm:border-gray-200">
                <div role="group" aria-labelledby="label-permissions">
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-baseline">
                    <div>
                      <div
                        className="text-base font-medium leading-6 sm:text-sm sm:leading-5"
                        id="label-permissions"
                      >
                        <FormattedMessage {...messages.permissions} />
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:col-span-2">
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
              </div>
              <div className="pt-5 mt-8 border-t border-gray-700">
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
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default UserEdit;
