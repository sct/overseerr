import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import * as Yup from 'yup';
import type { UserResultsResponse } from '../../../server/interfaces/api/userInterfaces';
import { hasPermission } from '../../../server/lib/permissions';
import AddUserIcon from '../../assets/useradd.svg';
import { useUpdateQueryParams } from '../../hooks/useUpdateQueryParams';
import { Permission, User, UserType, useUser } from '../../hooks/useUser';
import globalMessages from '../../i18n/globalMessages';
import Alert from '../Common/Alert';
import Badge from '../Common/Badge';
import Button from '../Common/Button';
import Header from '../Common/Header';
import LoadingSpinner from '../Common/LoadingSpinner';
import Modal from '../Common/Modal';
import PageTitle from '../Common/PageTitle';
import Table from '../Common/Table';
import Transition from '../Transition';
import BulkEditModal from './BulkEditModal';

const messages = defineMessages({
  users: 'Users',
  userlist: 'User List',
  importfromplex: 'Import Users from Plex',
  importfromplexerror: 'Something went wrong while importing users from Plex.',
  importedfromplex:
    '{userCount, plural, one {# new user} other {# new users}} imported from Plex successfully!',
  nouserstoimport: 'No new users to import from Plex.',
  user: 'User',
  totalrequests: 'Total Requests',
  accounttype: 'Account Type',
  role: 'Role',
  created: 'Created',
  lastupdated: 'Last Updated',
  bulkedit: 'Bulk Edit',
  owner: 'Owner',
  admin: 'Admin',
  plexuser: 'Plex User',
  deleteuser: 'Delete User',
  userdeleted: 'User deleted successfully!',
  userdeleteerror: 'Something went wrong while deleting the user.',
  deleteconfirm:
    'Are you sure you want to delete this user? All existing request data from this user will be removed.',
  localuser: 'Local User',
  createlocaluser: 'Create Local User',
  createuser: 'Create User',
  creating: 'Creating…',
  create: 'Create',
  validationpasswordminchars:
    'Password is too short; should be a minimum of 8 characters',
  usercreatedfailed: 'Something went wrong while creating the user.',
  usercreatedsuccess: 'User created successfully!',
  email: 'Email Address',
  password: 'Password',
  passwordinfodescription:
    'Email notifications need to be configured and enabled in order to automatically generate passwords.',
  autogeneratepassword: 'Automatically generate password',
  validationEmail: 'You must provide a valid email address',
  sortCreated: 'Creation Date',
  sortUpdated: 'Last Updated',
  sortDisplayName: 'Display Name',
  sortRequests: 'Request Count',
});

type Sort = 'created' | 'updated' | 'requests' | 'displayname';

const UserList: React.FC = () => {
  const intl = useIntl();
  const router = useRouter();
  const { addToast } = useToasts();
  const [currentSort, setCurrentSort] = useState<Sort>('created');
  const [currentPageSize, setCurrentPageSize] = useState<number>(10);

  const page = router.query.page ? Number(router.query.page) : 1;
  const pageIndex = page - 1;
  const updateQueryParams = useUpdateQueryParams({ page: page.toString() });

  const { data, error, revalidate } = useSWR<UserResultsResponse>(
    `/api/v1/user?take=${currentPageSize}&skip=${
      pageIndex * currentPageSize
    }&sort=${currentSort}`
  );

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
  const { user: currentUser, hasPermission: currentHasPermission } = useUser();

  useEffect(() => {
    const filterString = window.localStorage.getItem('ul-filter-settings');

    if (filterString) {
      const filterSettings = JSON.parse(filterString);

      setCurrentSort(filterSettings.currentSort);
      setCurrentPageSize(filterSettings.currentPageSize);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      'ul-filter-settings',
      JSON.stringify({
        currentSort,
        currentPageSize,
      })
    );
  }, [currentSort, currentPageSize]);

  const isUserPermsEditable = (userId: number) =>
    userId !== 1 && userId !== currentUser?.id;
  const isAllUsersSelected = () => {
    return (
      selectedUsers.length ===
      data?.results.filter((user) => user.id !== currentUser?.id).length
    );
  };
  const isUserSelected = (userId: number) => selectedUsers.includes(userId);
  const toggleAllUsers = () => {
    if (
      data &&
      selectedUsers.length >= 0 &&
      selectedUsers.length < data?.results.length - 1
    ) {
      setSelectedUsers(
        data.results
          .filter((user) => isUserPermsEditable(user.id))
          .map((u) => u.id)
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
        createdUsers.length
          ? intl.formatMessage(messages.importedfromplex, {
              userCount: createdUsers.length,
            })
          : intl.formatMessage(messages.nouserstoimport),
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
      .required(intl.formatMessage(messages.validationEmail))
      .email(intl.formatMessage(messages.validationEmail)),
    password: Yup.lazy((value) =>
      !value
        ? Yup.string()
        : Yup.string().min(
            8,
            intl.formatMessage(messages.validationpasswordminchars)
          )
    ),
  });

  if (!data) {
    return <LoadingSpinner />;
  }

  const hasNextPage = data.pageInfo.pages > pageIndex + 1;
  const hasPrevPage = pageIndex > 0;

  return (
    <>
      <PageTitle title={intl.formatMessage(messages.users)} />
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
                <Alert
                  title={intl.formatMessage(messages.passwordinfodescription)}
                />
                <Form className="section">
                  <div className="form-row">
                    <label htmlFor="email" className="text-label">
                      {intl.formatMessage(messages.email)}
                    </label>
                    <div className="form-input">
                      <div className="form-input-field">
                        <Field
                          id="email"
                          name="email"
                          type="text"
                          placeholder="name@example.com"
                        />
                      </div>
                      {errors.email && touched.email && (
                        <div className="error">{errors.email}</div>
                      )}
                    </div>
                  </div>
                  <div className="form-row">
                    <label htmlFor="genpassword" className="checkbox-label">
                      {intl.formatMessage(messages.autogeneratepassword)}
                    </label>
                    <div className="form-input">
                      <Field
                        type="checkbox"
                        id="genpassword"
                        name="genpassword"
                        onClick={() => setFieldValue('password', '')}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <label htmlFor="password" className="text-label">
                      {intl.formatMessage(messages.password)}
                    </label>
                    <div className="form-input">
                      <div className="form-input-field">
                        <Field
                          id="password"
                          name="password"
                          type="password"
                          disabled={values.genpassword}
                          placeholder={intl.formatMessage(messages.password)}
                        />
                      </div>
                      {errors.password && touched.password && (
                        <div className="error">{errors.password}</div>
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
          users={data.results}
        />
      </Transition>

      <div className="flex flex-col justify-between lg:items-end lg:flex-row">
        <Header>{intl.formatMessage(messages.userlist)}</Header>
        <div className="flex flex-col flex-grow mt-2 lg:flex-row lg:flex-grow-0">
          <div className="flex flex-row justify-between flex-grow mb-2 lg:mb-0 lg:flex-grow-0">
            <Button
              className="flex-grow mr-2 outline"
              buttonType="primary"
              onClick={() => setCreateModal({ isOpen: true })}
            >
              {intl.formatMessage(messages.createlocaluser)}
            </Button>
            <Button
              className="flex-grow outline lg:mr-2"
              buttonType="primary"
              disabled={isImporting}
              onClick={() => importFromPlex()}
            >
              {intl.formatMessage(messages.importfromplex)}
            </Button>
          </div>
          <div className="flex flex-grow mb-2 lg:mb-0 lg:flex-grow-0">
            <span className="inline-flex items-center px-3 text-sm text-gray-100 bg-gray-800 border border-r-0 border-gray-500 cursor-default rounded-l-md">
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
              </svg>
            </span>
            <select
              id="sort"
              name="sort"
              onChange={(e) => {
                setCurrentSort(e.target.value as Sort);
                router.push(router.pathname);
              }}
              value={currentSort}
              className="rounded-r-only"
            >
              <option value="created">
                {intl.formatMessage(messages.sortCreated)}
              </option>
              <option value="updated">
                {intl.formatMessage(messages.sortUpdated)}
              </option>
              <option value="requests">
                {intl.formatMessage(messages.sortRequests)}
              </option>
              <option value="displayname">
                {intl.formatMessage(messages.sortDisplayName)}
              </option>
            </select>
          </div>
        </div>
      </div>
      <Table>
        <thead>
          <tr>
            <Table.TH>
              {(data.results ?? []).length > 1 && (
                <input
                  type="checkbox"
                  id="selectAll"
                  name="selectAll"
                  checked={isAllUsersSelected()}
                  onChange={() => {
                    toggleAllUsers();
                  }}
                />
              )}
            </Table.TH>
            <Table.TH>{intl.formatMessage(messages.user)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.totalrequests)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.accounttype)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.role)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.created)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.lastupdated)}</Table.TH>
            <Table.TH className="text-right">
              {(data.results ?? []).length > 1 && (
                <Button
                  buttonType="warning"
                  onClick={() => setShowBulkEditModal(true)}
                  disabled={selectedUsers.length === 0}
                >
                  {intl.formatMessage(messages.bulkedit)}
                </Button>
              )}
            </Table.TH>
          </tr>
        </thead>
        <Table.TBody>
          {data?.results.map((user) => (
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
                  />
                )}
              </Table.TD>
              <Table.TD>
                <div className="flex items-center">
                  <Link href={`/users/${user.id}`}>
                    <a className="flex-shrink-0 w-10 h-10">
                      <img
                        className="w-10 h-10 rounded-full"
                        src={user.avatar}
                        alt=""
                      />
                    </a>
                  </Link>
                  <div className="ml-4">
                    <Link href={`/users/${user.id}`}>
                      <a className="text-sm font-medium leading-5 transition duration-300 hover:underline">
                        {user.displayName}
                      </a>
                    </Link>
                    <div className="text-sm leading-5 text-gray-300">
                      {user.email}
                    </div>
                  </div>
                </div>
              </Table.TD>
              <Table.TD>
                {user.id === currentUser?.id ||
                currentHasPermission(
                  [Permission.MANAGE_REQUESTS, Permission.REQUEST_VIEW],
                  { type: 'or' }
                ) ? (
                  <Link href={`/users/${user.id}/requests`}>
                    <a className="text-sm leading-5 transition duration-300 hover:underline">
                      {user.requestCount}
                    </a>
                  </Link>
                ) : (
                  user.requestCount
                )}
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
                {user.id === 1
                  ? intl.formatMessage(messages.owner)
                  : hasPermission(Permission.ADMIN, user.permissions)
                  ? intl.formatMessage(messages.admin)
                  : intl.formatMessage(messages.user)}
              </Table.TD>
              <Table.TD>
                {intl.formatDate(user.createdAt, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Table.TD>
              <Table.TD>
                {intl.formatDate(user.updatedAt, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Table.TD>
              <Table.TD alignText="right">
                <Button
                  buttonType="warning"
                  disabled={user.id === 1 && currentUser?.id !== 1}
                  className="mr-2"
                  onClick={() =>
                    router.push(
                      '/users/[userId]/settings',
                      `/users/${user.id}/settings`
                    )
                  }
                >
                  {intl.formatMessage(globalMessages.edit)}
                </Button>
                <Button
                  buttonType="danger"
                  disabled={
                    user.id === 1 ||
                    (currentUser?.id !== 1 &&
                      hasPermission(Permission.ADMIN, user.permissions))
                  }
                  onClick={() => setDeleteModal({ isOpen: true, user })}
                >
                  {intl.formatMessage(globalMessages.delete)}
                </Button>
              </Table.TD>
            </tr>
          ))}
          <tr className="bg-gray-700">
            <Table.TD colSpan={8} noPadding>
              <nav
                className="flex flex-col items-center w-screen px-6 py-3 space-x-4 space-y-3 sm:space-y-0 sm:flex-row lg:w-full"
                aria-label="Pagination"
              >
                <div className="hidden lg:flex lg:flex-1">
                  <p className="text-sm">
                    {data.results.length > 0 &&
                      intl.formatMessage(globalMessages.showingresults, {
                        from: pageIndex * currentPageSize + 1,
                        to:
                          data.results.length < currentPageSize
                            ? pageIndex * currentPageSize + data.results.length
                            : (pageIndex + 1) * currentPageSize,
                        total: data.pageInfo.results,
                        strong: function strong(msg) {
                          return <span className="font-medium">{msg}</span>;
                        },
                      })}
                  </p>
                </div>
                <div className="flex justify-center sm:flex-1 sm:justify-start lg:justify-center">
                  <span className="items-center -mt-3 text-sm sm:-ml-4 lg:ml-0 sm:mt-0">
                    {intl.formatMessage(globalMessages.resultsperpage, {
                      pageSize: (
                        <select
                          id="pageSize"
                          name="pageSize"
                          onChange={(e) => {
                            setCurrentPageSize(Number(e.target.value));
                            router
                              .push(router.pathname)
                              .then(() => window.scrollTo(0, 0));
                          }}
                          value={currentPageSize}
                          className="inline short"
                        >
                          <option value="5">5</option>
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                        </select>
                      ),
                    })}
                  </span>
                </div>
                <div className="flex justify-center flex-auto space-x-2 sm:justify-end sm:flex-1">
                  <Button
                    disabled={!hasPrevPage}
                    onClick={() =>
                      updateQueryParams('page', (page - 1).toString())
                    }
                  >
                    {intl.formatMessage(globalMessages.previous)}
                  </Button>
                  <Button
                    disabled={!hasNextPage}
                    onClick={() =>
                      updateQueryParams('page', (page + 1).toString())
                    }
                  >
                    {intl.formatMessage(globalMessages.next)}
                  </Button>
                </div>
              </nav>
            </Table.TD>
          </tr>
        </Table.TBody>
      </Table>
    </>
  );
};

export default UserList;
