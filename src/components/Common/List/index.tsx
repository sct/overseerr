import React from 'react';
import { withProperties } from '../../../utils/typeHelpers';

interface ListItemProps {
  title: string;
}

const ListItem: React.FC<ListItemProps> = ({ title, children }) => {
  return (
    <div className="py-4 sm:grid sm:grid-cols-4 sm:gap-4">
      <dt className="about-label">{title}</dt>
      <dd className="about">
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
        <h3 className="heading">{title}</h3>
        {subTitle && <p className="description">{subTitle}</p>}
      </div>
      <div className="section">
        <dl className="divide-y divide-gray-800">{children}</dl>
      </div>
    </>
  );
};

export default withProperties(List, { Item: ListItem });
