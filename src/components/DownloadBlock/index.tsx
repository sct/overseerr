import React from 'react';
import { defineMessages, FormattedRelativeTime, useIntl } from 'react-intl';
import { DownloadingItem } from '../../../server/lib/downloadtracker';
import Badge from '../Common/Badge';

const messages = defineMessages({
  estimatedtime: 'Estimated {time}',
});

interface DownloadBlockProps {
  downloadItem: DownloadingItem;
  is4k?: boolean;
}

const DownloadBlock: React.FC<DownloadBlockProps> = ({
  downloadItem,
  is4k = false,
}) => {
  const intl = useIntl();

  return (
    <div className="p-4">
      <div className="mb-2 w-56 truncate text-sm sm:w-80 md:w-full">
        {downloadItem.title}
      </div>
      <div className="relative mb-2 h-6 min-w-0 overflow-hidden rounded-full bg-gray-700">
        <div
          className="h-8 bg-indigo-600 transition-all duration-200 ease-in-out"
          style={{
            width: `${
              downloadItem.size
                ? Math.round(
                    ((downloadItem.size - downloadItem.sizeLeft) /
                      downloadItem.size) *
                      100
                  )
                : 0
            }%`,
          }}
        />
        <div className="absolute inset-0 flex h-6 w-full items-center justify-center text-xs">
          <span>
            {downloadItem.size
              ? Math.round(
                  ((downloadItem.size - downloadItem.sizeLeft) /
                    downloadItem.size) *
                    100
                )
              : 0}
            %
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span>
          {is4k && (
            <Badge badgeType="warning" className="mr-2">
              4K
            </Badge>
          )}
          <Badge className="capitalize">{downloadItem.status}</Badge>
        </span>
        <span>
          {downloadItem.estimatedCompletionTime
            ? intl.formatMessage(messages.estimatedtime, {
                time: (
                  <FormattedRelativeTime
                    value={Math.floor(
                      (new Date(
                        downloadItem.estimatedCompletionTime
                      ).getTime() -
                        Date.now()) /
                        1000
                    )}
                    updateIntervalInSeconds={1}
                    numeric="auto"
                  />
                ),
              })
            : ''}
        </span>
      </div>
    </div>
  );
};

export default DownloadBlock;
