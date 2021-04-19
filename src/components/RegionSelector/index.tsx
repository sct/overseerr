import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/solid';
import { hasFlag } from 'country-flag-icons';
import 'country-flag-icons/3x2/flags.css';
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

  const sortedRegions = useMemo(
    () =>
      regions?.sort((region1, region2) => {
        const region1Name =
          intl.formatDisplayName(region1.iso_3166_1, {
            type: 'region',
            fallback: 'none',
          }) ?? region1.english_name;
        const region2Name =
          intl.formatDisplayName(region2.iso_3166_1, {
            type: 'region',
            fallback: 'none',
          }) ?? region2.english_name;

        return region1Name === region2Name
          ? 0
          : region1Name > region2Name
          ? 1
          : -1;
      }),
    [intl, regions]
  );

  const defaultRegionNameFallback =
    regions?.find((region) => region.iso_3166_1 === currentSettings.region)
      ?.english_name ?? currentSettings.region;

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
    <div className="relative z-40 flex max-w-lg">
      <div className="w-full">
        <Listbox as="div" value={selectedRegion} onChange={setSelectedRegion}>
          {({ open }) => (
            <div className="relative">
              <span className="inline-block w-full rounded-md shadow-sm">
                <Listbox.Button className="relative flex items-center w-full py-2 pl-3 pr-10 text-left text-white transition duration-150 ease-in-out bg-gray-700 border border-gray-500 rounded-md cursor-default focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5">
                  {((selectedRegion && hasFlag(selectedRegion?.iso_3166_1)) ||
                    (isUserSetting &&
                      !selectedRegion &&
                      currentSettings.region &&
                      hasFlag(currentSettings.region))) && (
                    <span className="h-4 mr-2 overflow-hidden text-base leading-4">
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
                      ? intl.formatDisplayName(selectedRegion.iso_3166_1, {
                          type: 'region',
                          fallback: 'none',
                        }) ?? selectedRegion.english_name
                      : isUserSetting && selectedRegion?.iso_3166_1 !== 'all'
                      ? intl.formatMessage(messages.regionServerDefault, {
                          region: currentSettings.region
                            ? intl.formatDisplayName(currentSettings.region, {
                                type: 'region',
                                fallback: 'none',
                              }) ?? defaultRegionNameFallback
                            : intl.formatMessage(messages.regionDefault),
                        })
                      : intl.formatMessage(messages.regionDefault)}
                  </span>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500 pointer-events-none">
                    <ChevronDownIcon />
                  </span>
                </Listbox.Button>
              </span>

              <Transition
                show={open}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                className="absolute w-full mt-1 bg-gray-800 rounded-md shadow-lg"
              >
                <Listbox.Options
                  static
                  className="py-1 overflow-auto text-base leading-6 rounded-md shadow-xs max-h-60 focus:outline-none sm:text-sm sm:leading-5"
                >
                  {isUserSetting && (
                    <Listbox.Option value={null}>
                      {({ selected, active }) => (
                        <div
                          className={`${
                            active
                              ? 'text-white bg-indigo-600'
                              : 'text-gray-300'
                          } cursor-default select-none relative py-2 pl-8 pr-4 flex items-center`}
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
                                ? intl.formatDisplayName(
                                    currentSettings.region,
                                    {
                                      type: 'region',
                                      fallback: 'none',
                                    }
                                  ) ?? defaultRegionNameFallback
                                : intl.formatMessage(messages.regionDefault),
                            })}
                          </span>
                          {selected && (
                            <span
                              className={`${
                                active ? 'text-white' : 'text-indigo-600'
                              } absolute inset-y-0 left-0 flex items-center pl-1.5`}
                            >
                              <CheckIcon className="w-5 h-5" />
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
                          active ? 'text-white bg-indigo-600' : 'text-gray-300'
                        } cursor-default select-none relative py-2 pl-8 pr-4`}
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
                            <CheckIcon className="w-5 h-5" />
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
                            active
                              ? 'text-white bg-indigo-600'
                              : 'text-gray-300'
                          } cursor-default select-none relative py-2 pl-8 pr-4 flex items-center`}
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
                            {intl.formatDisplayName(region.iso_3166_1, {
                              type: 'region',
                              fallback: 'none',
                            }) ?? region.english_name}
                          </span>
                          {selected && (
                            <span
                              className={`${
                                active ? 'text-white' : 'text-indigo-600'
                              } absolute inset-y-0 left-0 flex items-center pl-1.5`}
                            >
                              <CheckIcon className="w-5 h-5" />
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
    </div>
  );
};

export default RegionSelector;
