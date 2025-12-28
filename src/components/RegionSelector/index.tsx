import useSettings from '@app/hooks/useSettings';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import type { Region } from '@server/lib/settings';
import { hasFlag } from 'country-flag-icons';
import 'country-flag-icons/3x2/flags.css';
import { sortBy } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  regionDefault: 'All Regions',
  regionServerDefault: 'Default ({region})',
});

interface RegionSelectorProps {
  value: string;
  name: string;
  isUserSetting?: boolean;
  disableAll?: boolean;
  watchProviders?: boolean;
  onChange?: (fieldName: string, region: string) => void;
}

const RegionSelector = ({
  name,
  value,
  isUserSetting = false,
  disableAll = false,
  watchProviders = false,
  onChange,
}: RegionSelectorProps) => {
  const { currentSettings } = useSettings();
  const intl = useIntl();
  const { data: regions } = useSWR<Region[]>(
    watchProviders ? '/api/v1/watchproviders/regions' : '/api/v1/regions'
  );
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);

  const allRegion: Region = useMemo(
    () => ({
      iso_3166_1: 'all',
      english_name: 'All',
    }),
    []
  );

  const sortedRegions = useMemo(() => {
    regions?.forEach((region: Region) => {
      region.name =
        intl.formatDisplayName(region.iso_3166_1, {
          type: 'region',
          fallback: 'none',
        }) ?? region.english_name;
    });

    return sortBy(regions, 'name');
  }, [intl, regions]);

  const regionName = (regionCode: string) =>
    sortedRegions?.find((region: Region) => region.iso_3166_1 === regionCode)
      ?.name ?? regionCode;

  useEffect(() => {
    if (regions && value) {
      if (value === 'all') {
        setSelectedRegions([allRegion]);
      } else {
        const values = value.split('|');
        const matchedRegions = regions.filter((region: Region) =>
          values.includes(region.iso_3166_1)
        );
        setSelectedRegions(matchedRegions.length > 0 ? matchedRegions : []);
      }
    } else {
      setSelectedRegions([]);
    }
  }, [value, regions, allRegion]);

  const handleChange = (regions: Region[]) => {
    const isAllSelected = regions.find((r) => r.iso_3166_1 === 'all');
    const isDefaultSelected = regions.find((r) => r.iso_3166_1 === 'default');

    // If "All" is selected and it wasn't before, clear others
    // If others are selected and "All" was selected, remove "All"
    let newSelection = regions;

    if (isDefaultSelected) {
      // If Default is selected, clear everything else (including All)
      newSelection = [];
    } else if (isAllSelected) {
      if (selectedRegions.some((r: Region) => r.iso_3166_1 === 'all')) {
        // All was already selected, so we are unselecting something else or selecting more specific things
        // If we are selecting something else, we should remove 'all'
        if (regions.length > 1) {
          newSelection = regions.filter((r) => r.iso_3166_1 !== 'all');
        }
      } else {
        // All was just selected, clear everything else
        newSelection = [allRegion];
      }
    }

    setSelectedRegions(newSelection);

    if (onChange) {
      if (newSelection.length > 0) {
        if (newSelection.some((r) => r.iso_3166_1 === 'all')) {
          onChange(name, 'all');
        } else {
          onChange(name, newSelection.map((r) => r.iso_3166_1).join('|'));
        }
      } else {
        onChange(name, '');
      }
    }
  };

  return (
    <div className="z-40 w-full">
      <Listbox
        as="div"
        value={selectedRegions}
        onChange={handleChange}
        multiple
      >
        {({ open }) => (
          <div className="relative">
            <span className="inline-block w-full rounded-md shadow-sm">
              <Listbox.Button className="focus:shadow-outline-blue relative flex w-full cursor-default items-center rounded-md border border-gray-500 bg-gray-700 py-2 pl-3 pr-10 text-left text-white transition duration-150 ease-in-out focus:border-blue-300 focus:outline-none sm:text-sm sm:leading-5">
                {selectedRegions.length > 0 &&
                selectedRegions[0].iso_3166_1 !== 'all' ? (
                  <span className="block truncate">
                    {selectedRegions.length === 1
                      ? regionName(selectedRegions[0].iso_3166_1)
                      : `${selectedRegions.length} Regions Selected`}
                  </span>
                ) : (
                  <span className="block truncate">
                    {isUserSetting && selectedRegions.length === 0
                      ? intl.formatMessage(messages.regionServerDefault, {
                          region: currentSettings.region
                            ? regionName(currentSettings.region)
                            : intl.formatMessage(messages.regionDefault),
                        })
                      : intl.formatMessage(messages.regionDefault)}
                  </span>
                )}
                {selectedRegions.length > 0 &&
                  selectedRegions[0].iso_3166_1 !== 'all' && (
                    <div className="ml-2 flex items-center space-x-1">
                      {selectedRegions.slice(0, 3).map(
                        (region) =>
                          hasFlag(region.iso_3166_1) && (
                            <span
                              key={region.iso_3166_1}
                              className="h-4 overflow-hidden text-base leading-4"
                            >
                              <span className={`flag:${region.iso_3166_1}`} />
                            </span>
                          )
                      )}
                      {selectedRegions.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{selectedRegions.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500">
                  <ChevronDownIcon className="h-5 w-5" />
                </span>
              </Listbox.Button>
            </span>

            <Transition
              show={open}
              leave="transition-opacity ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              className="absolute mt-1 w-full rounded-md bg-gray-800 shadow-lg"
            >
              <Listbox.Options
                static
                className="shadow-xs max-h-60 overflow-auto rounded-md py-1 text-base leading-6 focus:outline-none sm:text-sm sm:leading-5"
              >
                {isUserSetting && (
                  <Listbox.Option
                    value={{ iso_3166_1: 'default', english_name: 'Default' }}
                  >
                    {({ active }: { active: boolean }) => (
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
                            selectedRegions.length === 0
                              ? 'font-semibold'
                              : 'font-normal'
                          } block truncate`}
                        >
                          {intl.formatMessage(messages.regionServerDefault, {
                            region: currentSettings.region
                              ? regionName(currentSettings.region)
                              : intl.formatMessage(messages.regionDefault),
                          })}
                        </span>
                        {selectedRegions.length === 0 && (
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
                {!disableAll && (
                  <Listbox.Option value={allRegion}>
                    {({ active }: { active: boolean }) => (
                      <div
                        className={`${
                          active ? 'bg-indigo-600 text-white' : 'text-gray-300'
                        } relative cursor-default select-none py-2 pl-8 pr-4`}
                      >
                        <span
                          className={`${
                            selectedResources(selectedRegions, 'all')
                              ? 'font-semibold'
                              : 'font-normal'
                          } block truncate pl-8`}
                        >
                          {intl.formatMessage(messages.regionDefault)}
                        </span>
                        {selectedResources(selectedRegions, 'all') && (
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
                {sortedRegions?.map((region: Region) => (
                  <Listbox.Option key={region.iso_3166_1} value={region}>
                    {({ active }: { active: boolean }) => (
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
                            selectedResources(
                              selectedRegions,
                              region.iso_3166_1
                            )
                              ? 'font-semibold'
                              : 'font-normal'
                          } block truncate`}
                        >
                          {regionName(region.iso_3166_1)}
                        </span>
                        {selectedResources(
                          selectedRegions,
                          region.iso_3166_1
                        ) && (
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

const selectedResources = (selectedRegions: Region[], key: string) => {
  return selectedRegions.some((r) => r.iso_3166_1 === key);
};

export default RegionSelector;
