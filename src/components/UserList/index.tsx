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
      <div className="flex flex-col">
        <div className="my-2 overflow-x-auto -mx-6 sm:-mx-6 md:mx-4 lg:mx-4">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-500 text-left text-xs leading-4 font-medium text-gray-200 uppercase tracking-wider">
                      {intl.formatMessage(messages.username)}
                    </th>
                    <th className="px-6 py-3 bg-gray-500 text-left text-xs leading-4 font-medium text-gray-200 uppercase tracking-wider">
                      {intl.formatMessage(messages.totalrequests)}
                    </th>
                    <th className="px-6 py-3 bg-gray-500 text-left text-xs leading-4 font-medium text-gray-200 uppercase tracking-wider">
                      {intl.formatMessage(messages.usertype)}
                    </th>
                    <th className="px-6 py-3 bg-gray-500 text-left text-xs leading-4 font-medium text-gray-200 uppercase tracking-wider">
                      {intl.formatMessage(messages.role)}
                    </th>
                    <th className="px-6 py-3 bg-gray-500 text-left text-xs leading-4 font-medium text-gray-200 uppercase tracking-wider">
                      {intl.formatMessage(messages.created)}
                    </th>
                    <th className="px-6 py-3 bg-gray-500 text-left text-xs leading-4 font-medium text-gray-200 uppercase tracking-wider">
                      {intl.formatMessage(messages.lastupdated)}
                    </th>
                    <th className="px-6 py-3 bg-gray-500"></th>
                  </tr>
                </thead>
                <tbody className="bg-gray-600 divide-y divide-gray-700">
                  {data?.map((user) => (
                    <tr key={`user-list-${user.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.avatar}
                              alt=""
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm leading-5 font-medium text-white">
                              {user.username}
                            </div>
                            <div className="text-sm leading-5 text-gray-300">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm leading-5 text-white">
                          {user.requestCount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge badgeType="warning">
                          {intl.formatMessage(messages.plexuser)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm leading-5 text-white">
                        {hasPermission(Permission.ADMIN, user.permissions)
                          ? intl.formatMessage(messages.admin)
                          : intl.formatMessage(messages.user)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm leading-5 text-white">
                        <FormattedDate value={user.createdAt} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm leading-5 text-white">
                        <FormattedDate value={user.updatedAt} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm leading-5 font-medium">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserList;
