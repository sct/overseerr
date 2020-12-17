import React, { useState } from 'react';
import useSWR from 'swr';
import LoadingSpinner from '../Common/LoadingSpinner';
import type { User } from '../../../server/entity/User';
import Badge from '../Common/Badge';
import { FormattedDate, defineMessages, useIntl } from 'react-intl';
import Button from '../Common/Button';
import { hasPermission } from '../../../server/lib/permissions';
import { Permission } from '../../hooks/useUser';
import { useRouter } from 'next/router';
import Header from '../Common/Header';
import Table from '../Common/Table';
import Transition from '../Transition';
import Modal from '../Common/Modal';
import axios from 'axios';
import { useToasts } from 'react-toast-notifications';
import globalMessages from '../../i18n/globalMessages';

const messages = defineMessages({
  userlist: 'User List',
  username: 'Username',
  totalrequests: 'Total Requests',
  usertype: 'User Type',
  role: 'Role',
  created: 'Created',
  lastupdated: 'Last Updated',
  edit: 'Edit',
  delete: 'Delete',
  admin: 'Admin',
  user: 'User',
  plexuser: 'Plex User',
  deleteuser: 'Delete User',
  userdeleted: 'User deleted',
  userdeleteerror: 'Something went wrong deleting the user',
  deleteconfirm:
    'Are you sure you want to delete this user? All existing request data from this user will be removed.',
});

const UserList: React.FC = () => {
  const intl = useIntl();
  const router = useRouter();
  const { addToast } = useToasts();
  const { data, error, revalidate } = useSWR<User[]>('/api/v1/user');
  const [isDeleting, setDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    user?: User;
  }>({
    isOpen: false,
  });

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
      revalidate();
    }
  };

  if (!data && !error) {
    return <LoadingSpinner />;
  }

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
      <Header extraMargin={4}>{intl.formatMessage(messages.userlist)}</Header>
      <Table>
        <thead>
          <tr>
            <Table.TH>{intl.formatMessage(messages.username)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.totalrequests)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.usertype)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.role)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.created)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.lastupdated)}</Table.TH>
            <Table.TH></Table.TH>
          </tr>
        </thead>
        <Table.TBody>
          {data?.map((user) => (
            <tr key={`user-list-${user.id}`}>
              <Table.TD>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={user.avatar}
                      alt=""
                    />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm leading-5 font-medium">
                      {user.username}
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
                <Badge badgeType="warning">
                  {intl.formatMessage(messages.plexuser)}
                </Badge>
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
