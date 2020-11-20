import React from 'react';
import useSWR from 'swr';
import LoadingSpinner from '../Common/LoadingSpinner';
import Badge from '../Common/Badge';
import { FormattedDate, FormattedRelativeTime } from 'react-intl';
import Button from '../Common/Button';
import { hasPermission } from '../../../server/lib/permissions';
import { Permission } from '../../hooks/useUser';

const SettingsJobs: React.FC = () => {
  const { data, error } = useSWR<{ name: string; nextExecutionTime: string }[]>(
    '/api/v1/settings/jobs'
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col">
      <div className="my-2 overflow-x-auto -mx-6 sm:-mx-6 md:mx-4 lg:mx-4">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-500 text-left text-xs leading-4 font-medium text-gray-200 uppercase tracking-wider">
                    Job Name
                  </th>
                  <th className="px-6 py-3 bg-gray-500 text-left text-xs leading-4 font-medium text-gray-200 uppercase tracking-wider">
                    Next Execution
                  </th>
                  <th className="px-6 py-3 bg-gray-500"></th>
                </tr>
              </thead>
              <tbody className="bg-gray-600 divide-y divide-gray-700">
                {data?.map((job, index) => (
                  <tr key={`job-list-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm leading-5 text-white">
                        {job.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm leading-5 text-white">
                        <FormattedRelativeTime
                          value={Math.floor(
                            (new Date(job.nextExecutionTime).getTime() -
                              Date.now()) /
                              1000
                          )}
                          updateIntervalInSeconds={1}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm leading-5 font-medium">
                      <Button buttonType="primary">Run Now</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsJobs;
