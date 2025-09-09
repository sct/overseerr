import globalMessages from '@app/i18n/globalMessages';
import type { TmdbGenre } from '@server/api/themoviedb/interfaces';
import { sortBy } from 'lodash';
import { useMemo } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import type { CSSObjectWithLabel } from 'react-select';
import Select from 'react-select';
import useSWR from 'swr';

const messages = defineMessages({
  genreDefault: 'No Exclusions',
  genreServerDefault: 'Default ({genres})',
});

type OptionType = {
  value: string;
  label: string;
  isFixed?: boolean;
};

const selectStyles = {
  multiValueLabel: (base: CSSObjectWithLabel, props: { data: OptionType }) => {
    return props.data?.isFixed ? { ...base, paddingRight: 6 } : base;
  },
  multiValueRemove: (base: CSSObjectWithLabel, props: { data: OptionType }) => {
    return props.data?.isFixed ? { ...base, display: 'none' } : base;
  },
};

interface GenreSelectorProps {
  value?: string;
  setFieldValue: (property: string, value: string) => void;
  serverValue?: string;
  isUserSettings?: boolean;
}

const GenreSelector = ({
  value,
  setFieldValue,
  serverValue,
  isUserSettings = false,
}: GenreSelectorProps) => {
  const intl = useIntl();
  const { data: movieGenres } = useSWR<TmdbGenre[]>('/api/v1/genres/movie');
  const { data: tvGenres } = useSWR<TmdbGenre[]>('/api/v1/genres/tv');

  const allGenres = useMemo(() => {
    if (!movieGenres || !tvGenres) return [];

    // Combine and deduplicate genres by ID
    const combined = [...movieGenres, ...tvGenres];
    const uniqueGenres = combined.filter(
      (genre, index, self) => self.findIndex((g) => g.id === genre.id) === index
    );

    return sortBy(uniqueGenres, 'name');
  }, [movieGenres, tvGenres]);

  const genreName = (genreId: string) =>
    allGenres?.find((genre) => genre.id === Number(genreId))?.name ?? genreId;

  const options: OptionType[] =
    allGenres?.map((genre) => ({
      label: genre.name,
      value: genre.id.toString(),
    })) ?? [];

  if (isUserSettings) {
    options.unshift({
      value: 'server',
      label: intl.formatMessage(messages.genreServerDefault, {
        genres: serverValue
          ? serverValue
              .split('|')
              .map((value) => genreName(value))
              .reduce((prev, curr) =>
                intl.formatMessage(globalMessages.delimitedlist, {
                  a: prev,
                  b: curr,
                })
              )
          : intl.formatMessage(messages.genreDefault),
      }),
      isFixed: true,
    });
  }

  options.unshift({
    value: 'none',
    label: intl.formatMessage(messages.genreDefault),
    isFixed: true,
  });

  return (
    <Select<OptionType, true>
      options={options}
      isMulti
      className="react-select-container"
      classNamePrefix="react-select"
      value={
        (isUserSettings && value === 'none') || (!isUserSettings && !value)
          ? {
              value: 'none',
              label: intl.formatMessage(messages.genreDefault),
              isFixed: true,
            }
          : (value === '' || !value || value === 'server') && isUserSettings
          ? {
              value: 'server',
              label: intl.formatMessage(messages.genreServerDefault, {
                genres: serverValue
                  ? serverValue
                      .split('|')
                      .map((value) => genreName(value))
                      .reduce((prev, curr) =>
                        intl.formatMessage(globalMessages.delimitedlist, {
                          a: prev,
                          b: curr,
                        })
                      )
                  : intl.formatMessage(messages.genreDefault),
              }),
              isFixed: true,
            }
          : (value
              ?.split('|')
              .map((id) => {
                const matchedGenre = allGenres?.find(
                  (genre) => genre.id === Number(id)
                );

                if (!matchedGenre) {
                  return undefined;
                }

                return {
                  label: matchedGenre.name,
                  value: matchedGenre.id.toString(),
                };
              })
              .filter((option) => option !== undefined) as OptionType[])
      }
      onChange={(value, options) => {
        if (
          (options &&
            options.action === 'select-option' &&
            options.option?.value === 'server') ||
          value.every((v) => v.value === 'server')
        ) {
          return setFieldValue('excludedGenres', '');
        }

        if (
          (options &&
            options.action === 'select-option' &&
            options.option?.value === 'none') ||
          value.every((v) => v.value === 'none')
        ) {
          return setFieldValue('excludedGenres', isUserSettings ? 'none' : '');
        }

        setFieldValue(
          'excludedGenres',
          value
            .map((genre) => genre.value)
            .filter((v) => v !== 'none')
            .join('|')
        );
      }}
      styles={selectStyles}
    />
  );
};

export default GenreSelector;
