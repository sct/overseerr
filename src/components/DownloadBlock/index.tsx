import React from 'react';
import { FormattedRelativeTime } from 'react-intl';
import { DownloadingItem } from '../../../server/lib/downloadtracker';
import Badge from '../Common/Badge';

interface DownloadBlockProps {
  downloadItem: DownloadingItem;
}

const DownloadBlock: React.FC<DownloadBlockProps> = ({ downloadItem }) => {
  return (
    <div className="p-4">
      <div className="mb-2 text-sm truncate">{downloadItem.title}</div>
      <div className="relative w-full h-6 mb-2 overflow-hidden bg-gray-700 rounded-full">
        <div
          className="h-8 transition-all duration-200 ease-in-out bg-indigo-600"
          style={{
            width: `${Math.round(
              ((downloadItem.size - downloadItem.sizeLeft) /
                downloadItem.size) *
                100
            )}%`,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center w-full h-6 text-xs">
          <span>
            {Math.round(
              ((downloadItem.size - downloadItem.sizeLeft) /
                downloadItem.size) *
                100
            )}
            %
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <Badge className="capitalize">{downloadItem.status}</Badge>
        <span>
          ETA{' '}
          {downloadItem.estimatedCompletionTime ? (
            <FormattedRelativeTime
              value={Math.floor(
                (new Date(downloadItem.estimatedCompletionTime).getTime() -
                  Date.now()) /
                  1000
              )}
              updateIntervalInSeconds={1}
            />
          ) : (
            'N/A'
          )}
        </span>
      </div>
    </div>
  );
};

export default DownloadBlock;
