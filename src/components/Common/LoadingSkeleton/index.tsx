interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  height?: string;
  width?: string;
}

const LoadingSkeleton = ({
  className = '',
  count = 1,
  height = 'h-4',
  width = 'w-full',
}: LoadingSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded bg-gray-700 ${height} ${width} ${className}`}
        />
      ))}
    </>
  );
};

export const TitleCardSkeleton = () => {
  return (
    <div className="group relative flex aspect-[2/3] flex-col overflow-hidden rounded-lg bg-gray-800 shadow-lg ring-1 ring-gray-700 transition-all duration-300">
      <div className="relative h-full w-full">
        <div className="absolute inset-0 animate-pulse bg-gray-700" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent p-4">
        <LoadingSkeleton height="h-4" width="w-3/4" className="mb-2" />
        <LoadingSkeleton height="h-3" width="w-1/2" />
      </div>
    </div>
  );
};

export const RequestItemSkeleton = () => {
  return (
    <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-xl bg-gray-800 py-4 text-gray-400 shadow-md ring-1 ring-gray-700 xl:h-28 xl:flex-row">
      <div className="relative flex w-full flex-col justify-between overflow-hidden sm:flex-row">
        <div className="relative z-10 flex w-full items-center overflow-hidden pl-4 pr-4 sm:pr-0 xl:w-7/12 2xl:w-2/3">
          <div className="relative h-auto w-12 flex-shrink-0 overflow-hidden rounded-md">
            <div className="aspect-[2/3] w-full animate-pulse rounded-md bg-gray-700" />
          </div>
          <div className="flex flex-col justify-center overflow-hidden pl-2 xl:pl-4">
            <LoadingSkeleton height="h-4" width="w-16" className="mb-1" />
            <LoadingSkeleton height="h-5" width="w-48" className="mb-2" />
            <LoadingSkeleton height="h-3" width="w-32" />
          </div>
        </div>
        <div className="z-10 mt-4 ml-4 flex w-full flex-col justify-center overflow-hidden pr-4 text-sm sm:ml-2 sm:mt-0 xl:flex-1 xl:pr-0">
          <LoadingSkeleton height="h-4" width="w-24" className="mb-2" />
          <LoadingSkeleton height="h-4" width="w-32" />
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
