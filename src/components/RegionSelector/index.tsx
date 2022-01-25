import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/solid';
import { hasFlag } from 'country-flag-icons';
import 'country-flag-icons/3x2/flags.css';
import { sortBy } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';
import type { Region } from '../../../server/lib/settings';
import useSettings from '../../hooks/useSettings';

const messages = defineMessages({
  regionDefault: 'All Regions',
  regionServerDefault: 'Default ({region})',
});

interface RegionSelectorProps {
  value: string;
  name: string;
  isUserSetting?: boolean;
  onChange?: (fieldName: string, region: string) => void;
}

const RegionSelector: React.FC<RegionSelectorProps> = ({
  name,
  value,
  isUserSetting = false,
  onChange,
}) => {
  const { currentSettings } = useSettings();
  const intl = useIntl();
  const { data: regions } = useSWR<Region[]>('/api/v1/regions');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  const allRegion: Region = useMemo(
    () => ({
      iso_3166_1: 'all',
      english_name: 'All',
    }),
    []
  );

  const sortedRegions = useMemo(() => {
    regions?.forEach((region) => {
      region.name =
        intl.formatDisplayName(region.iso_3166_1, {
          type: 'region',
          fallback: 'none',
        }) ?? region.english_name;
    });

    return sortBy(regions, 'name');
  }, [intl, regions]);

  const regionName = (regionCode: string) =>
    sortedRegions?.find((region) => region.iso_3166_1 === regionCode)?.name ??
    regionCode;

  useEffect(() => {
    if (regions && value) {
      if (value === 'all') {
        setSelectedRegion(allRegion);
      } else {
        const matchedRegion = regions.find(
          (region) => region.iso_3166_1 === value
        );
        setSelectedRegion(matchedRegion ?? null);
      }
    }
  }, [value, regions, allRegion]);

  useEffect(() => {
    if (onChange && regions) {
      onChange(name, selectedRegion?.iso_3166_1 ?? '');
    }
  }, [onChange, selectedRegion, name, regions]);

  return (
    <div className="z-40 w-full">
      <Listbox as="div" value={selectedRegion} onChange={setSelectedRegion}>
        {({ open }) => (
          <div className="relative">
            <span className="inline-block w-full rounded-md shadow-sm">
              <Listbox.Button className="focus:shadow-outline-blue relative flex w-full cursor-default items-center rounded-md border border-gray-500 bg-gray-700 py-2 pl-3 pr-10 text-left text-white transition duration-150 ease-in-out focus:border-blue-300 focus:outline-none sm:text-sm sm:leading-5">
                {((selectedRegion && hasFlag(selectedRegion?.iso_3166_1)) ||
                  (isUserSetting &&
                    !selectedRegion &&
                    currentSettings.region &&
                    hasFlag(currentSettings.region))) && (
                  <span className="mr-2 h-4 overflow-hidden text-base leading-4">
                    <span
                      className={`flag:${
                        selectedRegion
                          ? selectedRegion.iso_3166_1
                          : currentSettings.region
                      }`}
                    />
                  </span>
                )}
                <span className="block truncate">
                  {selectedRegion && selectedRegion.iso_3166_1 !== 'all'
                    ? regionName(selectedRegion.iso_3166_1)
                    : isUserSetting && selectedRegion?.iso_3166_1 !== 'all'
                    ? intl.formatMessage(messages.regionServerDefault, {
                        region: currentSettings.region
                          ? regionName(currentSettings.region)
                          : intl.formatMessage(messages.regionDefault),
                      })
                    : intl.formatMessage(messages.regionDefault)}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500">
                  <ChevronDownIcon className="h-5 w-5" />
                </span>
              </Listbox.Button>
            </span>

            <Transition
              show={open}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              className="absolute mt-1 w-full rounded-md bg-gray-800 shadow-lg"
            >
              <Listbox.Options
                static
                className="shadow-xs max-h-60 overflow-auto rounded-md py-1 text-base leading-6 focus:outline-none sm:text-sm sm:leading-5"
              >
                {isUserSetting && (
                  <Listbox.Option value={null}>
                    {({ selected, active }) => (
                      <div
                        className={`${
                          active ? 'bg-indigo-600 text-white' : 'text-gray-300'
                        } relative flex cursor-default select-none items-center py-2 pl-8 pr-4`}
                      >
                        <span className="mr-2 text-base">
                          <span
                            className={
                              hasFlag(currentSettings.region)
                                ? `flag:${currentSettings.region}`
                                : 'pr-6'
                            }
                          />
                        </span>
                        <span
                          className={`${
                            selected ? 'font-semibold' : 'font-normal'
                          } block truncate`}
                        >
                          {intl.formatMessage(messages.regionServerDefault, {
                            region: currentSettings.region
                              ? regionName(currentSettings.region)
                              : intl.formatMessage(messages.regionDefault),
                          })}
                        </span>
                        {selected && (
                          <span
                            className={`${
                              active ? 'text-white' : 'text-indigo-600'
                            } absolute inset-y-0 left-0 flex items-center pl-1.5`}
                          >
                            <CheckIcon className="h-5 w-5" />
                          </span>
                        )}
                      </div>
                    )}
                  </Listbox.Option>
                )}
                <Listbox.Option value={isUserSetting ? allRegion : null}>
                  {({ selected, active }) => (
                    <div
                      className={`${
                        active ? 'bg-indigo-600 text-white' : 'text-gray-300'
                      } relative cursor-default select-none py-2 pl-8 pr-4`}
                    >
                      <span
                        className={`${
                          selected ? 'font-semibold' : 'font-normal'
                        } block truncate pl-8`}
                      >
                        {intl.formatMessage(messages.regionDefault)}
                      </span>
                      {selected && (
                        <span
                          className={`${
                            active ? 'text-white' : 'text-indigo-600'
                          } absolute inset-y-0 left-0 flex items-center pl-1.5`}
                        >
                          <CheckIcon className="h-5 w-5" />
                        </span>
                      )}
                    </div>
                  )}
                </Listbox.Option>
                {sortedRegions?.map((region) => (
                  <Listbox.Option key={region.iso_3166_1} value={region}>
                    {({ selected, active }) => (
                      <div
                        className={`${
                          active ? 'bg-indigo-600 text-white' : 'text-gray-300'
                        } relative flex cursor-default select-none items-center py-2 pl-8 pr-4`}
                      >
                        <span className="mr-2 text-base">
                          <span
                            className={
                              hasFlag(region.iso_3166_1)
                                ? `flag:${region.iso_3166_1}`
                                : 'pr-6'
                            }
                          />
                        </span>
                        <span
                          className={`${
                            selected ? 'font-semibold' : 'font-normal'
                          } block truncate`}
                        >
                          {regionName(region.iso_3166_1)}
                        </span>
                        {selected && (
                          <span
                            className={`${
                              active ? 'text-white' : 'text-indigo-600'
                            } absolute inset-y-0 left-0 flex items-center pl-1.5`}
                          >
                            <CheckIcon className="h-5 w-5" />
                          </span>
                        )}
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        )}
      </Listbox>
    </div>
  );
};

export default RegionSelector;
