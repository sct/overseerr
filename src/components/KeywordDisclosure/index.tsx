import Tag from '@app/components/Common/Tag';
import { useUser } from '@app/hooks/useUser';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import type { Keyword } from '@server/models/common';
import Link from 'next/link';

interface KeywordDisclosureProps {
  keywords: Keyword[];
  type: 'tv' | 'movies';
}

const KeywordDisclosure = ({ keywords, type }: KeywordDisclosureProps) => {
  const { user } = useUser();

  return (
    <>
      {keywords.length > 0 && (
        <Disclosure defaultOpen={!user?.settings?.collapseTags}>
          {({ open }) => (
            <>
              <Disclosure.Button
                className={`mt-2 flex w-full items-center justify-between space-x-2 border-gray-700 bg-gray-800 px-4 py-2 text-gray-200 ${
                  open
                    ? 'rounded-t-md border-t border-l border-r'
                    : 'rounded-md border'
                }`}
              >
                <span className="text-lg">Tags</span>
                <ChevronDownIcon
                  className={`${
                    open ? 'rotate-180' : ''
                  } h-6 w-6 text-gray-500`}
                />
              </Disclosure.Button>
              <Transition
                show={open}
                enter="transition-opacity duration-100 ease-out"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity duration-75 ease-out"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Disclosure.Panel className="w-full rounded-b-md border-b border-l border-r border-gray-700 px-4 py-4">
                  {keywords.map((keyword) => (
                    <Link
                      href={`/discover/${type}?keywords=${keyword.id}`}
                      key={`keyword-id-${keyword.id}`}
                    >
                      <a className="mr-2 inline-flex last:mr-0">
                        <Tag>{keyword.name}</Tag>
                      </a>
                    </Link>
                  ))}
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      )}
    </>
  );
};

export default KeywordDisclosure;
