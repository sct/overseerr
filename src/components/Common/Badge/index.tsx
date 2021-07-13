import React from 'react';

interface BadgeProps {
  badgeType?: 'default' | 'primary' | 'danger' | 'warning' | 'success';
  className?: string;
  url?: string;
}

const Badge: React.FC<BadgeProps> = ({
  badgeType = 'default',
  className,
  url,
  children,
}) => {
  const badgeStyle = [
    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
  ];

  if (url) {
    badgeStyle.push('transition cursor-pointer');
  } else {
    badgeStyle.push('cursor-default');
  }

  switch (badgeType) {
    case 'danger':
      badgeStyle.push('bg-red-600 text-red-100');
      if (url) {
        badgeStyle.push('hover:bg-red-500');
      }
      break;
    case 'warning':
      badgeStyle.push('bg-yellow-500 text-yellow-100');
      if (url) {
        badgeStyle.push('hover:bg-yellow-400');
      }
      break;
    case 'success':
      badgeStyle.push('bg-green-500 text-green-100');
      if (url) {
        badgeStyle.push('hover:bg-green-400');
      }
      break;
    default:
      badgeStyle.push('bg-indigo-500 text-indigo-100');
      if (url) {
        badgeStyle.push('hover:bg-indigo-400');
      }
  }

  if (className) {
    badgeStyle.push(className);
  }

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <span className={badgeStyle.join(' ')}>{children}</span>
      </a>
    );
  } else {
    return <span className={badgeStyle.join(' ')}>{children}</span>;
  }
};

export default Badge;
