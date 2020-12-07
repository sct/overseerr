import React from 'react';
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
});

const UserList: React.FC = () => {
  const intl = useIntl();
  const router = useRouter();
  const { data, error } = useSWR<User[]>('/api/v1/user');

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <>
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
                <Button buttonType="danger">
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
