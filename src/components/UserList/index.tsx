import React, { useState } from 'react';
import useSWR from 'swr';
import LoadingSpinner from '../Common/LoadingSpinner';
import type { User } from '../../../server/entity/User';
import Badge from '../Common/Badge';
import { FormattedDate, defineMessages, useIntl } from 'react-intl';
import Button from '../Common/Button';
import { hasPermission } from '../../../server/lib/permissions';
import { Permission, UserType, useUser } from '../../hooks/useUser';
import { useRouter } from 'next/router';
import Header from '../Common/Header';
import Table from '../Common/Table';
import Transition from '../Transition';
import Modal from '../Common/Modal';
import axios from 'axios';
import { useToasts } from 'react-toast-notifications';
import globalMessages from '../../i18n/globalMessages';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import AddUserIcon from '../../assets/useradd.svg';
import Alert from '../Common/Alert';
import BulkEditModal from './BulkEditModal';

const messages = defineMessages({
  userlist: 'User List',
  importfromplex: 'Import Users From Plex',
  importfromplexerror: 'Something went wrong importing users from Plex',
  importedfromplex:
    '{userCount, plural, =0 {No new users} one {# new user} other {# new users}} imported from Plex',
  username: 'Username',
  totalrequests: 'Total Requests',
  usertype: 'User Type',
  role: 'Role',
  created: 'Created',
  lastupdated: 'Last Updated',
  edit: 'Edit',
  bulkedit: 'Bulk Edit',
  delete: 'Delete',
  admin: 'Admin',
  user: 'User',
  plexuser: 'Plex User',
  deleteuser: 'Delete User',
  userdeleted: 'User deleted',
  userdeleteerror: 'Something went wrong deleting the user',
  deleteconfirm:
    'Are you sure you want to delete this user? All existing request data from this user will be removed.',
  localuser: 'Local User',
  createlocaluser: 'Create Local User',
  createuser: 'Create User',
  creating: 'Creating',
  create: 'Create',
  validationemailrequired: 'Must enter a valid email address.',
  validationpasswordminchars:
    'Password is too short - should be 8 chars minimum.',
  usercreatedfailed: 'Something went wrong when trying to create the user',
  usercreatedsuccess: 'Successfully created the user',
  email: 'Email Address',
  password: 'Password',
  passwordinfo: 'Password Info',
  passwordinfodescription:
    'Email notification settings need to be enabled and setup in order to use the auto generated passwords',
  autogeneratepassword: 'Automatically generate password',
});

const UserList: React.FC = () => {
  const intl = useIntl();
  const router = useRouter();
  const { addToast } = useToasts();
  const { data, error, revalidate } = useSWR<User[]>('/api/v1/user');
  const [isDeleting, setDeleting] = useState(false);
  const [isImporting, setImporting] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    user?: User;
  }>({
    isOpen: false,
  });
  const [createModal, setCreateModal] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const { user: currentUser } = useUser();

  const isUserPermsEditable = (userId: number) =>
    userId !== 1 && userId !== currentUser?.id;
  const isAllUsersSelected = () => {
    return (
      selectedUsers.length ===
      data?.filter((user) => user.id !== currentUser?.id).length
    );
  };
  const isUserSelected = (userId: number) => selectedUsers.includes(userId);
  const toggleAllUsers = () => {
    if (
      data &&
      selectedUsers.length >= 0 &&
      selectedUsers.length < data?.length - 1
    ) {
      setSelectedUsers(
        data.filter((user) => isUserPermsEditable(user.id)).map((u) => u.id)
      );
    } else {
      setSelectedUsers([]);
    }
  };
  const toggleUser = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers((users) => users.filter((u) => u !== userId));
    } else {
      setSelectedUsers((users) => [...users, userId]);
    }
  };

  const deleteUser = async () => {
    setDeleting(true);

    try {
      await axios.delete(`/api/v1/user/${deleteModal.user?.id}`);

      addToast(intl.formatMessage(messages.userdeleted), {
        autoDismiss: true,
        appearance: 'success',
      });
      setDeleteModal({ isOpen: false });
    } catch (e) {
      addToast(intl.formatMessage(messages.userdeleteerror), {
        autoDismiss: true,
        appearance: 'error',
      });
    } finally {
      setDeleting(false);
      revalidate();
    }
  };

  const importFromPlex = async () => {
    setImporting(true);

    try {
      const { data: createdUsers } = await axios.post(
        '/api/v1/user/import-from-plex'
      );
      addToast(
        intl.formatMessage(messages.importedfromplex, {
          userCount: createdUsers.length,
        }),
        {
          autoDismiss: true,
          appearance: 'success',
        }
      );
    } catch (e) {
      addToast(intl.formatMessage(messages.importfromplexerror), {
        autoDismiss: true,
        appearance: 'error',
      });
    } finally {
      revalidate();
      setImporting(false);
    }
  };

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  const CreateUserSchema = Yup.object().shape({
    email: Yup.string()
      .email()
      .required(intl.formatMessage(messages.validationemailrequired)),
    password: Yup.lazy((value) =>
      !value ? Yup.string() : Yup.string().min(8)
    ),
  });

  return (
    <>
      <Transition
        enter="opacity-0 transition duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="opacity-100 transition duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        show={deleteModal.isOpen}
      >
        <Modal
          onOk={() => deleteUser()}
          okText={
            isDeleting
              ? intl.formatMessage(globalMessages.deleting)
              : intl.formatMessage(globalMessages.delete)
          }
          okDisabled={isDeleting}
          okButtonType="danger"
          onCancel={() => setDeleteModal({ isOpen: false })}
          title={intl.formatMessage(messages.deleteuser)}
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          }
        >
          {intl.formatMessage(messages.deleteconfirm)}
        </Modal>
      </Transition>

      <Transition
        enter="opacity-0 transition duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="opacity-100 transition duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        show={createModal.isOpen}
      >
        <Formik
          initialValues={{
            email: '',
            password: '',
            genpassword: true,
          }}
          validationSchema={CreateUserSchema}
          onSubmit={async (values) => {
            try {
              await axios.post('/api/v1/user', {
                email: values.email,
                password: values.genpassword ? null : values.password,
              });
              addToast(intl.formatMessage(messages.usercreatedsuccess), {
                appearance: 'success',
                autoDismiss: true,
              });
              setCreateModal({ isOpen: false });
            } catch (e) {
              addToast(intl.formatMessage(messages.usercreatedfailed), {
                appearance: 'error',
                autoDismiss: true,
              });
            } finally {
              revalidate();
            }
          }}
        >
          {({
            errors,
            touched,
            isSubmitting,
            values,
            isValid,
            setFieldValue,
            handleSubmit,
          }) => {
            return (
              <Modal
                title={intl.formatMessage(messages.createuser)}
                iconSvg={<AddUserIcon className="h-6" />}
                onOk={() => handleSubmit()}
                okText={
                  isSubmitting
                    ? intl.formatMessage(messages.creating)
                    : intl.formatMessage(messages.create)
                }
                okDisabled={isSubmitting || !isValid}
                okButtonType="primary"
                onCancel={() => setCreateModal({ isOpen: false })}
              >
                <Alert title={intl.formatMessage(messages.passwordinfo)}>
                  {intl.formatMessage(messages.passwordinfodescription)}
                </Alert>
                <Form>
                  <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-800">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                    >
                      {intl.formatMessage(messages.email)}
                    </label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                      <div className="flex max-w-lg rounded-md shadow-sm">
                        <Field
                          id="email"
                          name="email"
                          type="text"
                          placeholder="name@example.com"
                          className="flex-1 block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                        />
                      </div>
                      {errors.email && touched.email && (
                        <div className="mt-2 text-red-500">{errors.email}</div>
                      )}
                    </div>
                    <label
                      htmlFor="genpassword"
                      className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                    >
                      {intl.formatMessage(messages.autogeneratepassword)}
                    </label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                      <Field
                        type="checkbox"
                        id="genpassword"
                        name="genpassword"
                        className="w-6 h-6 text-indigo-600 transition duration-150 ease-in-out rounded-md form-checkbox"
                        onClick={() => setFieldValue('password', '')}
                      />
                    </div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium leading-5 text-gray-400 sm:mt-px"
                    >
                      {intl.formatMessage(messages.password)}
                    </label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                      <div className="flex max-w-lg rounded-md shadow-sm">
                        <Field
                          id="password"
                          name="password"
                          type="password"
                          disabled={values.genpassword}
                          placeholder={intl.formatMessage(messages.password)}
                          className="flex-1 block w-full min-w-0 transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md form-input sm:text-sm sm:leading-5"
                        />
                      </div>
                      {errors.password && touched.password && (
                        <div className="mt-2 text-red-500">
                          {errors.password}
                        </div>
                      )}
                    </div>
                  </div>
                </Form>
              </Modal>
            );
          }}
        </Formik>
      </Transition>

      <Transition
        enter="opacity-0 transition duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="opacity-100 transition duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        show={showBulkEditModal}
      >
        <BulkEditModal
          onCancel={() => setShowBulkEditModal(false)}
          onComplete={() => {
            setShowBulkEditModal(false);
            revalidate();
          }}
          selectedUserIds={selectedUsers}
          users={data}
        />
      </Transition>

      <div className="flex flex-col justify-between sm:flex-row">
        <Header>{intl.formatMessage(messages.userlist)}</Header>
        <div className="flex">
          <Button
            className="mx-4 my-8 outline"
            buttonType="primary"
            onClick={() => setCreateModal({ isOpen: true })}
          >
            {intl.formatMessage(messages.createlocaluser)}
          </Button>
          <Button
            className="mx-4 my-8"
            buttonType="primary"
            disabled={isImporting}
            onClick={() => importFromPlex()}
          >
            {intl.formatMessage(messages.importfromplex)}
          </Button>
        </div>
      </div>

      <Table>
        <thead>
          <tr>
            <Table.TH>
              <input
                type="checkbox"
                id="selectAll"
                name="selectAll"
                checked={isAllUsersSelected()}
                onChange={() => {
                  toggleAllUsers();
                }}
                className="w-6 h-6 text-indigo-600 transition duration-150 ease-in-out rounded-md form-checkbox"
              />
            </Table.TH>
            <Table.TH>{intl.formatMessage(messages.username)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.totalrequests)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.usertype)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.role)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.created)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.lastupdated)}</Table.TH>
            <Table.TH className="text-right">
              <Button
                buttonSize="sm"
                buttonType="warning"
                onClick={() => setShowBulkEditModal(true)}
                disabled={selectedUsers.length === 0}
              >
                {intl.formatMessage(messages.bulkedit)}
              </Button>
            </Table.TH>
          </tr>
        </thead>
        <Table.TBody>
          {data?.map((user) => (
            <tr key={`user-list-${user.id}`}>
              <Table.TD>
                {isUserPermsEditable(user.id) && (
                  <input
                    type="checkbox"
                    id={`user-list-select-${user.id}`}
                    name={`user-list-select-${user.id}`}
                    checked={isUserSelected(user.id)}
                    onChange={() => {
                      toggleUser(user.id);
                    }}
                    className="w-6 h-6 text-indigo-600 transition duration-150 ease-in-out rounded-md form-checkbox"
                  />
                )}
              </Table.TD>
              <Table.TD>
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10">
                    <img
                      className="w-10 h-10 rounded-full"
                      src={user.avatar}
                      alt=""
                    />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium leading-5">
                      {user.displayName}
                    </div>
                    <div className="text-sm leading-5 text-gray-300">
                      {user.email}
                    </div>
                  </div>
                </div>
              </Table.TD>
              <Table.TD>
                <div className="text-sm leading-5">{user.requestCount}</div>
              </Table.TD>
              <Table.TD>
                {user.userType === UserType.PLEX ? (
                  <Badge badgeType="warning">
                    {intl.formatMessage(messages.plexuser)}
                  </Badge>
                ) : (
                  <Badge badgeType="default">
                    {intl.formatMessage(messages.localuser)}
                  </Badge>
                )}
              </Table.TD>
              <Table.TD>
                {hasPermission(Permission.ADMIN, user.permissions)
                  ? intl.formatMessage(messages.admin)
                  : intl.formatMessage(messages.user)}
              </Table.TD>
              <Table.TD>
                <FormattedDate value={user.createdAt} />
              </Table.TD>
              <Table.TD>
                <FormattedDate value={user.updatedAt} />
              </Table.TD>
              <Table.TD alignText="right">
                <Button
                  buttonType="warning"
                  className="mr-2"
                  onClick={() =>
                    router.push(
                      '/users/[userId]/edit',
                      `/users/${user.id}/edit`
                    )
                  }
                >
                  {intl.formatMessage(messages.edit)}
                </Button>
                <Button
                  buttonType="danger"
                  disabled={hasPermission(Permission.ADMIN, user.permissions)}
                  onClick={() => setDeleteModal({ isOpen: true, user })}
                >
                  {intl.formatMessage(messages.delete)}
                </Button>
              </Table.TD>
            </tr>
          ))}
        </Table.TBody>
      </Table>
    </>
  );
};

export default UserList;
