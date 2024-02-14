interface PlaceholderProps {
  canExpand?: boolean;
  type?: 'music' | 'movie' | 'tv';
}

const Placeholder = ({
  canExpand = false,
  type = 'movie',
}: PlaceholderProps) => {
  return (
    <div
      className={`relative animate-pulse rounded-xl bg-gray-700 ${
        canExpand ? 'w-full' : 'w-36 sm:w-36 md:w-44'
      }`}
    >
      <div
        className="w-full"
        style={
          type === 'music' ? { aspectRatio: '1/1' } : { paddingBottom: '150%' }
        }
      />
    </div>
  );
};

export default Placeholder;
