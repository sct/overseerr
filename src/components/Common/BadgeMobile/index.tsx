import { forwardRef } from 'react';

interface BadgeMobileProps {
  badgeType?:
    | 'default'
    | 'primary'
    | 'primary4K'
    | 'danger'
    | 'danger4K'
    | 'warning'
    | 'warning4K'
    | 'success'
    | 'success4K';
  className?: string;
  href?: string;
  children: React.ReactNode;
}

const BadgeMobile = (
  { badgeType = 'default', className, children }: BadgeMobileProps,
  ref?: React.Ref<HTMLElement>
) => {
  const badgeVersion = [
    'inline-flex whitespace-nowrap rounded-full text-xs font-semibold leading-5 md:hidden',
  ];
  const badgeStyle = ['w-5 rounded-full p-0.5 text-white ring-1'];

  switch (badgeType) {
    case 'primary':
      badgeStyle.push('bg-indigo-500 ring-indigo-400');
      break;
    case 'primary4K':
      badgeVersion.push('ring-1 ring-gray-700');
      badgeStyle.push('bg-indigo-500 ring-indigo-400');
      break;
    case 'danger':
      badgeStyle.push('bg-red-500 ring-red-400');
      break;
    case 'danger4K':
      badgeVersion.push('ring-1 ring-gray-700');
      badgeStyle.push('bg-red-500 ring-red-400');
      break;
    case 'warning':
      badgeStyle.push('bg-yellow-500 ring-yellow-400');
      break;
    case 'warning4K':
      badgeVersion.push('ring-1 ring-gray-700');
      badgeStyle.push('bg-yellow-500 ring-yellow-400');
      break;
    case 'success':
      badgeStyle.push('bg-green-500 ring-green-400');
      break;
    case 'success4K':
      badgeVersion.push('ring-1 ring-gray-700');
      badgeStyle.push('bg-green-500 ring-green-400');
      break;
    default:
      badgeStyle.push('bg-indigo-500 ring-indigo-400');
  }

  if (className) {
    badgeStyle.push(className);
  }

  return (
    <div
      className={badgeVersion.join(' ')}
      ref={ref as React.Ref<HTMLDivElement>}
    >
      <div
        className={badgeStyle.join(' ')}
        ref={ref as React.Ref<HTMLDivElement>}
      >
        {children}
      </div>
      {badgeType.includes('4K') && (
        <span className="pl-1 pr-2 text-gray-200">4K</span>
      )}
    </div>
  );
};

export default forwardRef(BadgeMobile) as typeof BadgeMobile;
