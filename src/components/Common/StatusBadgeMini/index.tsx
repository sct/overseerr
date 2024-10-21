import Spinner from '@app/assets/spinner.svg';
import { CheckCircleIcon } from '@heroicons/react/20/solid';
import { BellIcon, ClockIcon, MinusSmallIcon } from '@heroicons/react/24/solid';
import { MediaStatus } from '@server/constants/media';

interface StatusBadgeMiniProps {
  status: MediaStatus;
  is4k?: boolean;
  inProgress?: boolean;
  // Should the badge shrink on mobile to a smaller size? (TitleCard)
  shrink?: boolean;
}

const StatusBadgeMini = ({
  status,
  is4k = false,
  inProgress = false,
  shrink = true,
}: StatusBadgeMiniProps) => {
  const badgeStyle = [
    `bg-opacity-80 shadow-md w-full h-full pl-3.5 md:pl-4 ${
      shrink ? 'border' : 'ring-1'
    }`,
  ];

  let indicatorIcon: React.ReactNode;

  // clip-path not directly supported in Tailwind.
  const triangleStyle = {
    clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
  };

  switch (status) {
    case MediaStatus.PROCESSING:
      badgeStyle.push(
        'bg-indigo-500 border-indigo-400 ring-indigo-400 text-indigo-100'
      );
      indicatorIcon = <ClockIcon />;
      break;
    case MediaStatus.AVAILABLE:
      badgeStyle.push(
        'bg-green-500 border-green-400 ring-green-400 text-green-100'
      );
      indicatorIcon = <CheckCircleIcon />;
      break;
    case MediaStatus.PENDING:
      badgeStyle.push(
        'bg-yellow-500 border-yellow-400 ring-yellow-400 text-yellow-100'
      );
      indicatorIcon = <BellIcon />;
      break;
    case MediaStatus.PARTIALLY_AVAILABLE:
      badgeStyle.push(
        'bg-green-500 border-green-400 ring-green-400 text-green-100'
      );
      indicatorIcon = <MinusSmallIcon />;
      break;
  }

  if (inProgress) {
    indicatorIcon = <Spinner />;
  }

  return (
    <div
      className={`absolute top-0 right-0 inline-flex whitespace-nowrap border-gray-700 text-xs font-semibold leading-5 ring-gray-700 ${
        shrink ? 'h-9 w-9 md:h-10 md:w-10' : 'h-10 w-10 ring-1'
      }`}
    >
      <div className={badgeStyle.join(' ')} style={triangleStyle}>
        {indicatorIcon}
      </div>
      {is4k && <span className="pl-1 pr-2 text-gray-200">4K</span>}
    </div>
  );
};

export default StatusBadgeMini;
