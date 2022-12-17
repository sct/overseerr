import Button from '@app/components/Common/Button';
import MediaSlider from '@app/components/MediaSlider';
import { encodeURIExtraParams } from '@app/hooks/useSearchInput';
import { PlusIcon } from '@heroicons/react/solid';
import { DiscoverSliderType } from '@server/constants/discover';
import { Field, Form, Formik } from 'formik';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  addSlider: 'Add Slider',
  slidernameplaceholder: 'Slider Name',
  providetmdbkeywordid: 'Provide a TMDB Keyword ID',
  providetmdbgenreid: 'Provide a TMDB Genre ID',
});

type CreateSliderProps = {
  onCreate: (
    sliderType: DiscoverSliderType,
    title: string,
    data: string
  ) => void;
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

  const options: CreateOption[] = [
    {
      type: DiscoverSliderType.TMDB_MOVIE_KEYWORD,
      // Unsure if this should be localized since we are referring to a direct API
      title: 'TMDB Movie Keyword',
      dataUrl: '/api/v1/discover/movies',
      params: 'keywords=$value',
      titlePlaceholderText: intl.formatMessage(messages.slidernameplaceholder),
      dataPlaceholderText: intl.formatMessage(messages.providetmdbkeywordid),
    },
    {
      type: DiscoverSliderType.TMDB_MOVIE_GENRE,
      // Unsure if this should be localized since we are referring to a direct API
      title: 'TMDB Movie Genre',
      dataUrl: '/api/v1/discover/movies/genre/$value',
      titlePlaceholderText: intl.formatMessage(messages.slidernameplaceholder),
      dataPlaceholderText: intl.formatMessage(messages.providetmdbgenreid),
    },
  ];

  return (
    <Formik
      initialValues={{
        sliderType: DiscoverSliderType.TMDB_MOVIE_KEYWORD,
        title: '',
        data: '',
      }}
      enableReinitialize
      onSubmit={(values) => {
        onCreate(Number(values.sliderType), values.title, values.data);
      }}
    >
      {({ values }) => {
        const activeOption = options.find(
          (option) => option.type === Number(values.sliderType)
        );

        return (
          <Form>
            <div className="flex items-center space-x-2 rounded border-2 border-dashed border-gray-700 bg-gray-800 px-2 py-2 text-gray-100">
              <PlusIcon className="h-6 w-6" />
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
              <Field
                type="text"
                name="data"
                id="data"
                placeholder={activeOption?.dataPlaceholderText}
              />
              <div className="flex-1"></div>
              <Button buttonType="primary" buttonSize="sm">
                {intl.formatMessage(messages.addSlider)}
              </Button>
            </div>

            <div className="relative px-4">
              {activeOption && values.title && values.data && (
                <MediaSlider
                  sliderKey="preview"
                  title={values.title}
                  url={activeOption?.dataUrl.replace(
                    '$value',
                    encodeURIExtraParams(values.data)
                  )}
                  extraParams={activeOption.params?.replace(
                    '$value',
                    encodeURIExtraParams(values.data)
                  )}
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
