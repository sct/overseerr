import Infinity from '@app/assets/infinity.svg';
import { SmallLoadingSpinner } from '@app/components/Common/LoadingSpinner';
import ProgressCircle from '@app/components/Common/ProgressCircle';
import type { QuotaResponse } from '@server/interfaces/api/userInterfaces';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  movierequests: 'Movie Requests',
  seriesrequests: 'Series Requests',
});

type MiniQuotaDisplayProps = {
  userId: number;
};

const MiniQuotaDisplay = ({ userId }: MiniQuotaDisplayProps) => {
  const intl = useIntl();
  const { data, error } = useSWR<QuotaResponse>(`/api/v1/user/${userId}/quota`);

  if (error) {
    return null;
  }

  if (!data && !error) {
    return <SmallLoadingSpinner />;
  }

  return (
    <>
      {((data?.movie.limit ?? 0) !== 0 || (data?.tv.limit ?? 0) !== 0) && (
        <div className="flex">
          <div className="flex basis-1/2 flex-col space-y-2">
            <div className="text-sm text-gray-200">
              {intl.formatMessage(messages.movierequests)}
            </div>
            <div className="flex h-full items-center space-x-2 text-gray-200">
              {data?.movie.limit ?? 0 > 0 ? (
                <>
                  <ProgressCircle
                    className="h-8 w-8"
                    progress={Math.round(
                      ((data?.movie.remaining ?? 0) /
                        (data?.movie.limit ?? 1)) *
                        100
                    )}
                    useHeatLevel
                  />
                  <span className="text-lg font-bold">
                    {data?.movie.remaining} / {data?.movie.limit}
                  </span>
                </>
              ) : (
                <>
                  <Infinity className="w-7" />
                  <span className="font-bold">Unlimited</span>
                </>
              )}
            </div>
          </div>
          <div className="flex basis-1/2 flex-col space-y-2">
            <div className="text-sm text-gray-200">
              {intl.formatMessage(messages.seriesrequests)}
            </div>
            <div className="flex h-full items-center space-x-2 text-gray-200">
              {data?.tv.limit ?? 0 > 0 ? (
                <>
                  <ProgressCircle
                    className="h-8 w-8"
                    progress={Math.round(
                      ((data?.tv.remaining ?? 0) / (data?.tv.limit ?? 1)) * 100
                    )}
                    useHeatLevel
                  />
                  <span className="text-lg font-bold text-gray-200">
                    {data?.tv.remaining} / {data?.tv.limit}
                  </span>
                </>
              ) : (
                <>
                  <Infinity className="w-7" />
                  <span className="font-bold">Unlimited</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MiniQuotaDisplay;
