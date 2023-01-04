import { TagIcon } from '@heroicons/react/24/outline';

type TagProps = {
  content: string;
};

const Tag = ({ content }: TagProps) => {
  return (
    <div className="inline-flex cursor-pointer items-center rounded-full bg-gray-800 px-2 py-1 text-sm text-gray-200 ring-1 ring-gray-600 transition hover:bg-gray-700">
      <TagIcon className="mr-1 h-4 w-4" />
      <span>{content}</span>
    </div>
  );
};

export default Tag;
