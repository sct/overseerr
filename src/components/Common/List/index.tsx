import React from 'react';
import { withProperties } from '../../../utils/typeHelpers';

interface ListItemProps {
  title: string;
}

const ListItem: React.FC<ListItemProps> = ({ title, children }) => {
  return (
    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-200">{title}</dt>
      <dd className="mt-1 flex text-sm text-gray-400 sm:mt-0 sm:col-span-2">
        <span className="flex-grow">{children}</span>
      </dd>
    </div>
  );
};

interface ListProps {
  title: string;
  subTitle?: string;
}

const List: React.FC<ListProps> = ({ title, subTitle, children }) => {
  return (
    <>
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-100">{title}</h3>
        {subTitle && (
          <p className="mt-1 max-w-2xl text-sm text-gray-300">{subTitle}</p>
        )}
      </div>
      <div className="mt-5 border-t border-gray-800">
        <dl className="divide-y divide-gray-800">{children}</dl>
      </div>
    </>
  );
};

export default withProperties(List, { Item: ListItem });
