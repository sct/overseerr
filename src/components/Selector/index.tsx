import { encodeURIExtraParams } from '@app/hooks/useSearchInput';
import type {
  TmdbCompanySearchResponse,
  TmdbGenre,
  TmdbKeywordSearchResponse,
} from '@server/api/themoviedb/interfaces';
import type { GenreSliderItem } from '@server/interfaces/api/discoverInterfaces';
import type { Keyword, ProductionCompany } from '@server/models/common';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import type { MultiValue, SingleValue } from 'react-select';
import AsyncSelect from 'react-select/async';

const messages = defineMessages({
  searchKeywords: 'Search keywords…',
  searchGenres: 'Select genres…',
  searchStudios: 'Search studios…',
  starttyping: 'Starting typing to search.',
  nooptions: 'No results.',
});

type SingleVal = {
  label: string;
  value: number;
};

type BaseSelectorMultiProps = {
  defaultValue?: string;
  isMulti: true;
  onChange: (value: MultiValue<SingleVal> | null) => void;
};

type BaseSelectorSingleProps = {
  defaultValue?: string;
  isMulti?: false;
  onChange: (value: SingleValue<SingleVal> | null) => void;
};

export const CompanySelector = ({
  defaultValue,
  isMulti,
  onChange,
}: BaseSelectorSingleProps | BaseSelectorMultiProps) => {
  const intl = useIntl();
  const [defaultDataValue, setDefaultDataValue] = useState<
    { label: string; value: number }[] | null
  >(null);

  useEffect(() => {
    const loadDefaultCompany = async (): Promise<void> => {
      if (!defaultValue) {
        return;
      }

      const response = await axios.get<ProductionCompany>(
        `/api/v1/studio/${defaultValue}`
      );

      const studio = response.data;

      setDefaultDataValue([
        {
          label: studio.name ?? '',
          value: studio.id ?? 0,
        },
      ]);
    };

    loadDefaultCompany();
  }, [defaultValue]);

  const loadCompanyOptions = async (inputValue: string) => {
    if (inputValue === '') {
      return [];
    }

    const results = await axios.get<TmdbCompanySearchResponse>(
      '/api/v1/search/company',
      {
        params: {
          query: encodeURIExtraParams(inputValue),
        },
      }
    );

    return results.data.results.map((result) => ({
      label: result.name,
      value: result.id,
    }));
  };

  return (
    <AsyncSelect
      key={`company-selector-${defaultDataValue}`}
      className="react-select-container"
      classNamePrefix="react-select"
      isMulti={isMulti}
      defaultValue={defaultDataValue}
      defaultOptions
      cacheOptions
      isClearable
      noOptionsMessage={({ inputValue }) =>
        inputValue === ''
          ? intl.formatMessage(messages.starttyping)
          : intl.formatMessage(messages.nooptions)
      }
      loadOptions={loadCompanyOptions}
      placeholder={intl.formatMessage(messages.searchStudios)}
      onChange={(value) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onChange(value as any);
      }}
    />
  );
};

type GenreSelectorProps = (BaseSelectorMultiProps | BaseSelectorSingleProps) & {
  type: 'movie' | 'tv';
};

export const GenreSelector = ({
  isMulti,
  defaultValue,
  onChange,
  type,
}: GenreSelectorProps) => {
  const intl = useIntl();
  const [defaultDataValue, setDefaultDataValue] = useState<
    { label: string; value: number }[] | null
  >(null);

  useEffect(() => {
    const loadDefaultGenre = async (): Promise<void> => {
      if (!defaultValue) {
        return;
      }

      const genres = defaultValue.split(',');

      const response = await axios.get<TmdbGenre[]>(`/api/v1/genres/${type}`);

      const genreData = genres
        .filter((genre) => response.data.find((gd) => gd.id === Number(genre)))
        .map((g) => response.data.find((gd) => gd.id === Number(g)))
        .map((g) => ({
          label: g?.name ?? '',
          value: g?.id ?? 0,
        }));

      setDefaultDataValue(genreData);
    };

    loadDefaultGenre();
  }, [defaultValue, type]);

  const loadGenreOptions = async () => {
    const results = await axios.get<GenreSliderItem[]>(
      `/api/v1/discover/genreslider/${type}`
    );

    return results.data.map((result) => ({
      label: result.name,
      value: result.id,
    }));
  };

  return (
    <AsyncSelect
      key={`genre-select-${defaultDataValue}`}
      className="react-select-container"
      classNamePrefix="react-select"
      defaultValue={isMulti ? defaultDataValue : defaultDataValue?.[0]}
      defaultOptions
      cacheOptions
      isMulti={isMulti}
      loadOptions={loadGenreOptions}
      placeholder={intl.formatMessage(messages.searchGenres)}
      onChange={(value) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onChange(value as any);
      }}
    />
  );
};

export const KeywordSelector = ({
  isMulti,
  defaultValue,
  onChange,
}: BaseSelectorMultiProps | BaseSelectorSingleProps) => {
  const intl = useIntl();
  const [defaultDataValue, setDefaultDataValue] = useState<
    { label: string; value: number }[] | null
  >(null);

  useEffect(() => {
    const loadDefaultKeywords = async (): Promise<void> => {
      if (!defaultValue) {
        return;
      }

      const keywords = await Promise.all(
        defaultValue.split(',').map(async (keywordId) => {
          const keyword = await axios.get<Keyword>(
            `/api/v1/keyword/${keywordId}`
          );

          return keyword.data;
        })
      );

      setDefaultDataValue(
        keywords.map((keyword) => ({
          label: keyword.name,
          value: keyword.id,
        }))
      );
    };

    loadDefaultKeywords();
  }, [defaultValue]);

  const loadKeywordOptions = async (inputValue: string) => {
    const results = await axios.get<TmdbKeywordSearchResponse>(
      '/api/v1/search/keyword',
      {
        params: {
          query: encodeURIExtraParams(inputValue),
        },
      }
    );

    return results.data.results.map((result) => ({
      label: result.name,
      value: result.id,
    }));
  };

  return (
    <AsyncSelect
      key={`keyword-select-${defaultDataValue}`}
      inputId="data"
      isMulti={isMulti}
      className="react-select-container"
      classNamePrefix="react-select"
      noOptionsMessage={({ inputValue }) =>
        inputValue === ''
          ? intl.formatMessage(messages.starttyping)
          : intl.formatMessage(messages.nooptions)
      }
      defaultValue={defaultDataValue}
      loadOptions={loadKeywordOptions}
      placeholder={intl.formatMessage(messages.searchKeywords)}
      onChange={(value) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onChange(value as any);
      }}
    />
  );
};
