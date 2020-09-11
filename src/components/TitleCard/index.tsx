import React, { useState } from 'react';
import Transition from '../Transition';

interface TitleCardProps {
  image: string;
  summary: string;
  year: string;
  title: string;
  userScore: number;

  //TODO - change to ENUM
  status: string;
}

const TitleCard: React.FC<TitleCardProps> = ({
  image,
  summary,
  year,
  title,
  userScore,
  status,
}) => {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div style={{ width: 250 }}>
      <div
        className="titleCard"
        style={{
          backgroundImage: `url(//${image})`,
        }}
        onMouseEnter={() => setShowDetail(true)}
        onMouseLeave={() => setShowDetail(false)}
      >
        <div className="absolute top-0 h-full w-full bottom-0 left-0 right-0 overflow-hidden">
          <Transition
            show={showDetail}
            enter="transition ease-in-out duration-300 transform opacity-0"
            enterFrom="translate-y-full opacity-0"
            enterTo="translate-y-0 opacity-100"
            leave="transition ease-in-out duration-300 transform opacity-100"
            leaveFrom="translate-y-0 opacity-100"
            leaveTo="translate-y-full opacity-0"
          >
            <div className="absolute w-full bottom-0 bg-white rounded-lg overflow-hidden">
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
                    User Score: {userScore}
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-200 rounded-b-lg">
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
    </div>
  );
};

export default TitleCard;
