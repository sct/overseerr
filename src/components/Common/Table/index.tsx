import React, { AllHTMLAttributes } from 'react';
import { withProperties } from '../../../utils/typeHelpers';

const TBody: React.FC = ({ children }) => {
  return (
    <tbody className="bg-gray-600 divide-y divide-gray-700">{children}</tbody>
  );
};

const TH: React.FC<AllHTMLAttributes<HTMLTableHeaderCellElement>> = ({
  children,
  className,
  ...props
}) => {
  const style = [
    'px-6 py-3 bg-gray-500 text-left text-xs leading-4 font-medium text-gray-200 uppercase tracking-wider',
  ];

  if (className) {
    style.push(className);
  }

  return (
    <th className={style.join(' ')} {...props}>
      {children}
    </th>
  );
};

interface TDProps extends AllHTMLAttributes<HTMLTableCellElement> {
  alignText?: 'left' | 'center' | 'right';
  noPadding?: boolean;
}

const TD: React.FC<TDProps> = ({
  children,
  alignText = 'left',
  noPadding,
  className,
  ...props
}) => {
  const style = ['whitespace-nowrap text-sm leading-5 text-white'];

  switch (alignText) {
    case 'left':
      style.push('text-left');
      break;
    case 'center':
      style.push('text-center');
      break;
    case 'right':
      style.push('text-right');
      break;
  }

  if (!noPadding) {
    style.push('px-6 py-4');
  }

  if (className) {
    style.push(className);
  }

  return (
    <td className={style.join(' ')} {...props}>
      {children}
    </td>
  );
};

const Table: React.FC = ({ children }) => {
  return (
    <div className="flex flex-col">
      <div className="my-2 overflow-x-auto -mx-6 md:mx-0 lg:mx-0">
        <div className="py-2 align-middle inline-block min-w-full">
          <div className="shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full">{children}</table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withProperties(Table, { TH, TBody, TD });
