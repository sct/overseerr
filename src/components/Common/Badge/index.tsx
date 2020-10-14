import React from 'react';

interface BadgeProps {
  badgeType?: 'default' | 'primary' | 'danger' | 'warning' | 'success';
}

const Badge: React.FC<BadgeProps> = ({ badgeType = 'default', children }) => {
  const badgeStyle = [
    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
  ];

  switch (badgeType) {
    case 'danger':
      badgeStyle.push('bg-red-600 text-red-100');
      break;
    case 'warning':
      badgeStyle.push('bg-orange-500 text-orange-100');
      break;
    case 'success':
      badgeStyle.push('bg-green-400 text-green-100');
      break;
    default:
      badgeStyle.push('bg-indigo-500 text-indigo-100');
  }

  return <span className={badgeStyle.join(' ')}>{children}</span>;
};

export default Badge;
