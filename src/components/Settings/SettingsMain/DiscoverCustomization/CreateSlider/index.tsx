import Button from '@app/components/Common/Button';
import Tooltip from '@app/components/Common/Tooltip';
import { sliderTitles } from '@app/components/Discover/constants';
import MediaSlider from '@app/components/MediaSlider';
import { encodeURIExtraParams } from '@app/hooks/useSearchInput';
import type {
  TmdbCompanySearchResponse,
  TmdbKeywordSearchResponse,
} from '@server/api/themoviedb/interfaces';
import { DiscoverSliderType } from '@server/constants/discover';
import type { GenreSliderItem } from '@server/interfaces/api/discoverInterfaces';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { debounce } from 'lodash';
import { useCallback, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import AsyncSelect from 'react-select/async';
import { useToasts } from 'react-toast-notifications';
import * as Yup from 'yup';

const messages = defineMessages({
  addSlider: 'Add Slider',
  slidernameplaceholder: 'Slider Name',
  providetmdbkeywordid: 'Provide a TMDB Keyword ID',
  providetmdbgenreid: 'Provide a TMDB Genre ID',
  providetmdbsearch: 'Provide a search query',
  providetmdbstudio: 'Provide TMDB Studio ID',
  providetmdbnetwork: 'Provide TMDB Network ID',
  addsuccess: 'Created new slider and saved discover customization settings.',
  addfail: 'Failed to create new slider.',
  needresults: 'You need to have at least 1 result to create a slider.',
  validationDatarequired: 'You must provide a data value.',
  validationTitlerequired: 'You must provide a title.',
  addcustomslider: 'Add Custom Slider',
  searchKeywords: 'Search keywords…',
  seachGenres: 'Search genres…',
  searchStudios: 'Search studios…',
  starttyping: 'Starting typing to search.',
  nooptions: 'No results.',
});

type CreateSliderProps = {
  onCreate: () => void;
};

type CreateOption = {
  type: DiscoverSliderType;
  title: string;
  dataUrl: string;
  params?: string;
  titlePlaceholderText: string;
  dataPlaceholderText: string;
};

const CreateSlider = ({ onCreate }: CreateSliderProps) => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const [resultCount, setResultCount] = useState(0);

  const CreateSliderSchema = Yup.object().shape({
    title: Yup.string().required(
      intl.formatMessage(messages.validationTitlerequired)
    ),
    data: Yup.string().required(
      intl.formatMessage(messages.validationDatarequired)
    ),
  });

  const updateResultCount = useCallback(
    (count: number) => {
      setResultCount(count);
    },
    [setResultCount]
  );

  const loadKeywordOptions = debounce(async (inputValue: string) => {
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
  }, 100);

  const loadCompanyOptions = debounce(async (inputValue: string) => {
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
  }, 100);

  const loadMovieGenreOptions = async () => {
    const results = await axios.get<GenreSliderItem[]>(
      '/api/v1/discover/genreslider/movie'
    );

    return results.data.map((result) => ({
      label: result.name,
      value: result.id,
    }));
  };

  const loadTvGenreOptions = async () => {
    const results = await axios.get<GenreSliderItem[]>(
      '/api/v1/discover/genreslider/tv'
    );

    return results.data.map((result) => ({
      label: result.name,
      value: result.id,
    }));
  };

  const options: CreateOption[] = [
    {
      type: DiscoverSliderType.TMDB_MOVIE_KEYWORD,
      title: intl.formatMessage(sliderTitles.tmdbmoviekeyword),
      dataUrl: '/api/v1/discover/movies',
      params: 'keywords=$value',
      titlePlaceholderText: intl.formatMessage(messages.slidernameplaceholder),
      dataPlaceholderText: intl.formatMessage(messages.providetmdbkeywordid),
    },
    {
      type: DiscoverSliderType.TMDB_TV_KEYWORD,
      title: intl.formatMessage(sliderTitles.tmdbtvkeyword),
      dataUrl: '/api/v1/discover/tv',
      params: 'keywords=$value',
      titlePlaceholderText: intl.formatMessage(messages.slidernameplaceholder),
      dataPlaceholderText: intl.formatMessage(messages.providetmdbkeywordid),
    },
    {
      type: DiscoverSliderType.TMDB_MOVIE_GENRE,
      title: intl.formatMessage(sliderTitles.tmdbmoviegenre),
      dataUrl: '/api/v1/discover/movies/genre/$value',
      titlePlaceholderText: intl.formatMessage(messages.slidernameplaceholder),
      dataPlaceholderText: intl.formatMessage(messages.providetmdbgenreid),
    },
    {
      type: DiscoverSliderType.TMDB_TV_GENRE,
      title: intl.formatMessage(sliderTitles.tmdbtvgenre),
      dataUrl: '/api/v1/discover/tv/genre/$value',
      titlePlaceholderText: intl.formatMessage(messages.slidernameplaceholder),
      dataPlaceholderText: intl.formatMessage(messages.providetmdbgenreid),
    },
    {
      type: DiscoverSliderType.TMDB_STUDIO,
      title: intl.formatMessage(sliderTitles.tmdbstudio),
      dataUrl: '/api/v1/discover/movies/studio/$value',
      titlePlaceholderText: intl.formatMessage(messages.slidernameplaceholder),
      dataPlaceholderText: intl.formatMessage(messages.providetmdbstudio),
    },
    {
      type: DiscoverSliderType.TMDB_NETWORK,
      title: intl.formatMessage(sliderTitles.tmdbnetwork),
      dataUrl: '/api/v1/discover/tv/network/$value',
      titlePlaceholderText: intl.formatMessage(messages.slidernameplaceholder),
      dataPlaceholderText: intl.formatMessage(messages.providetmdbnetwork),
    },
    {
      type: DiscoverSliderType.TMDB_SEARCH,
      title: intl.formatMessage(sliderTitles.tmdbsearch),
      dataUrl: '/api/v1/search',
      params: 'query=$value',
      titlePlaceholderText: intl.formatMessage(messages.slidernameplaceholder),
      dataPlaceholderText: intl.formatMessage(messages.providetmdbsearch),
    },
  ];

  return (
    <Formik
      initialValues={{
        sliderType: DiscoverSliderType.TMDB_MOVIE_KEYWORD,
        title: '',
        data: '',
      }}
      validationSchema={CreateSliderSchema}
      enableReinitialize
      onSubmit={async (values, { resetForm }) => {
        try {
          await axios.post('/api/v1/settings/discover/add', {
            type: Number(values.sliderType),
            title: values.title,
            data: values.data,
          });

          addToast(intl.formatMessage(messages.addsuccess), {
            appearance: 'success',
            autoDismiss: true,
          });
          onCreate();
          resetForm();
        } catch (e) {
          addToast(intl.formatMessage(messages.addfail), {
            appearance: 'error',
            autoDismiss: true,
          });
        }
      }}
    >
      {({ values, isValid, isSubmitting, errors, touched, setFieldValue }) => {
        const activeOption = options.find(
          (option) => option.type === Number(values.sliderType)
        );

        let dataInput: React.ReactNode;

        switch (activeOption?.type) {
          case DiscoverSliderType.TMDB_MOVIE_KEYWORD:
          case DiscoverSliderType.TMDB_TV_KEYWORD:
            dataInput = (
              <AsyncSelect
                key="keyword-select"
                inputId="data"
                isMulti
                className="react-select-container"
                classNamePrefix="react-select"
                noOptionsMessage={({ inputValue }) =>
                  inputValue === ''
                    ? intl.formatMessage(messages.starttyping)
                    : intl.formatMessage(messages.nooptions)
                }
                loadOptions={loadKeywordOptions}
                placeholder={intl.formatMessage(messages.searchKeywords)}
                onChange={(value) => {
                  const keywords = value.map((item) => item.value).join(',');

                  setFieldValue('data', keywords);
                }}
              />
            );
            break;
          case DiscoverSliderType.TMDB_MOVIE_GENRE:
            dataInput = (
              <AsyncSelect
                key="movie-genre-select"
                className="react-select-container"
                classNamePrefix="react-select"
                defaultOptions
                cacheOptions
                loadOptions={loadMovieGenreOptions}
                placeholder={intl.formatMessage(messages.seachGenres)}
                onChange={(value) => {
                  setFieldValue('data', value?.value);
                }}
              />
            );
            break;
          case DiscoverSliderType.TMDB_TV_GENRE:
            dataInput = (
              <AsyncSelect
                key="tv-genre-select"
                className="react-select-container"
                classNamePrefix="react-select"
                defaultOptions
                cacheOptions
                loadOptions={loadTvGenreOptions}
                placeholder={intl.formatMessage(messages.seachGenres)}
                onChange={(value) => {
                  setFieldValue('data', value?.value);
                }}
              />
            );
            break;
          case DiscoverSliderType.TMDB_STUDIO:
            dataInput = (
              <AsyncSelect
                key="studio-select"
                className="react-select-container"
                classNamePrefix="react-select"
                defaultOptions
                cacheOptions
                loadOptions={loadCompanyOptions}
                placeholder={intl.formatMessage(messages.searchStudios)}
                onChange={(value) => {
                  setFieldValue('data', value?.value);
                }}
              />
            );
            break;
          default:
            dataInput = (
              <Field
                type="text"
                name="data"
                id="data"
                placeholder={activeOption?.dataPlaceholderText}
              />
            );
        }

        return (
          <Form data-testid="create-discover-option-form">
            <div className="flex flex-col space-y-2 rounded border-2 border-dashed border-gray-700 bg-gray-800 px-2 py-2 text-gray-100">
              <span className="text-overseerr text-xl font-semibold">
                {intl.formatMessage(messages.addcustomslider)}
              </span>
              <Field as="select" id="sliderType" name="sliderType">
                {options.map((option) => (
                  <option value={option.type} key={`type-${option.type}`}>
                    {option.title}
                  </option>
                ))}
              </Field>
              <Field
                type="text"
                name="title"
                id="title"
                placeholder={activeOption?.titlePlaceholderText}
              />
              {errors.title &&
                touched.title &&
                typeof errors.title === 'string' && (
                  <div className="error">{errors.title}</div>
                )}
              {dataInput}
              {errors.data &&
                touched.data &&
                typeof errors.data === 'string' && (
                  <div className="error">{errors.data}</div>
                )}
              <div className="flex-1"></div>
              {resultCount === 0 ? (
                <Tooltip content={intl.formatMessage(messages.needresults)}>
                  <div>
                    <Button buttonType="primary" buttonSize="sm" disabled>
                      {intl.formatMessage(messages.addSlider)}
                    </Button>
                  </div>
                </Tooltip>
              ) : (
                <div>
                  <Button
                    buttonType="primary"
                    buttonSize="sm"
                    disabled={isSubmitting || !isValid}
                  >
                    {intl.formatMessage(messages.addSlider)}
                  </Button>
                </div>
              )}
            </div>

            <div className="relative px-4 pb-4">
              {activeOption && values.title && values.data && (
                <MediaSlider
                  sliderKey={`preview-${values.title}`}
                  title={values.title}
                  url={activeOption?.dataUrl.replace(
                    '$value',
                    encodeURIExtraParams(values.data)
                  )}
                  extraParams={activeOption.params?.replace(
                    '$value',
                    encodeURIExtraParams(values.data)
                  )}
                  onNewTitles={updateResultCount}
                />
              )}
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default CreateSlider;
