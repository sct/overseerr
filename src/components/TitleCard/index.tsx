import React, { useState } from 'react';
import Transition from '../Transition';

interface TitleCardProps {
  image?: string;
  summary?: string;
  year?: string;
  title?: string;
  userScore?: number;
  status?: string;
}

const TitleCard: React.FC<TitleCardProps> = ({
  image,
  summary = 'Test summary of movie that will be the greatest movie of all time since it is Reiwa',
  year = '2020',
  title = 'Sample Title',
  userScore = 99,
  status = 'Not Requested',
}) => {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div
      className="relative pb-8/12 bg-red-500"
      style={{ width: 250 }}
      onMouseEnter={() => setShowDetail((state) => !state)}
      onMouseLeave={() => setShowDetail((state) => !state)}
    >
      <div className="absolute top-0 h-full w-full bottom-0 left-0 right-0">
        <Transition
          show={showDetail}
          enter="transition ease-in-out duration-300 transform"
          enterFrom="translate-y-full"
          enterTo="translate-y-0"
          leave="transition ease-in-out duration-300 transform"
          leaveFrom="translate-y-0"
          leaveTo="translate-y-full"
        >
          <div className="relative -mt-16 bg-white rounded-lg shadow-lg">
            <div className="p-5">
              <div className="text-blue-800 text-sm font-bold leading-4 ">
                {year}
              </div>

              <h1 className="mt-2 text-2xl text-gray-900 leading-5 font-semibold">
                {title}
              </h1>
              <div className="mt-2 text-gray-500 text-m font-semibold tracking-wide leading-tight truncate hover:overflow-visible">
                {summary}
              </div>

              <div className="mt-1 flex justify-between">
                <span className="mt-3 text-teal-800 text-sm font-semibold leading-4 ">
                  Status: {status}
                </span>

                <span className="mt-3 text-purple-800 text-sm font-semibold leading-4 ">
                  User Score: {userScore}/100
                </span>
              </div>
            </div>
            <div className="border-t border-gray-200">
              <div className="-mt-px flex">
                <div className="w-0 flex-1 flex border-r border-gray-200">
                  <a
                    href="#"
                    className="relative -mr-px w-0 flex-1 inline-flex items-center justify-center py-4 text-sm leading-5 text-gray-700 font-medium border border-transparent rounded-bl-lg hover:text-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 transition ease-in-out duration-150"
                  >
                    <span className="ml-3">View More</span>
                  </a>
                </div>
                <div className="-ml-px w-0 flex-1 flex">
                  <a
                    href="#"
                    className="relative w-0 flex-1 inline-flex items-center justify-center py-4 text-sm leading-5 text-gray-700 font-medium border border-transparent rounded-br-lg hover:text-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 transition ease-in-out duration-150"
                  >
                    <span className="ml-3">Request</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  );
};

export default TitleCard;
