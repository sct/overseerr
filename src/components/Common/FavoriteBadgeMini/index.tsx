import { StarIcon } from '@heroicons/react/24/solid';

interface FavoriteBadgeMiniProps {
  favorite?: boolean;
  shrink?: boolean;
}

const FavoriteBadgeMini = ({
  favorite = false,
  shrink = false,
}: FavoriteBadgeMiniProps) => {
  const badgeStyle = [
    `rounded-full bg-opacity-80 shadow-md ${
      shrink ? 'w-4 sm:w-5 border p-0' : 'w-5 ring-1 p-0.5'
    }`,
  ];

  let indicatorIcon: React.ReactNode;

  badgeStyle.push(
    'bg-yellow-500 border-yellow-400 ring-yellow-400 text-yellow-100'
  );
  indicatorIcon = <StarIcon />;

  return (
    <div
      className={`relative inline-flex whitespace-nowrap rounded-full border-gray-700 text-xs font-semibold leading-5 ring-gray-700 ${
        shrink ? '' : 'ring-1'
      }`}
      style={{ paddingRight: '3px' }}
    >
      <div className={badgeStyle.join(' ')}>{indicatorIcon}</div>
    </div>
  );
};

export default FavoriteBadgeMini;
