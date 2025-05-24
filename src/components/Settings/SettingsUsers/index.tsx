import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import PermissionEdit from '@app/components/PermissionEdit';
import QuotaSelector from '@app/components/QuotaSelector';
import globalMessages from '@app/i18n/globalMessages';
import { ArrowDownOnSquareIcon } from '@heroicons/react/24/outline';
import type { MainSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR, { mutate } from 'swr';
import * as Yup from 'yup';

const messages = defineMessages({
  users: 'Users',
  userSettings: 'User Settings',
  userSettingsDescription: 'Configure global and default user settings.',
  toastSettingsSuccess: 'User settings saved successfully!',
  toastSettingsFailure: 'Something went wrong while saving settings.',
  localLogin: 'Enable Local Sign-In',
  localLoginTip:
    'Allow users to sign in using their email address and password, instead of Plex OAuth',
  newPlexLogin: 'Enable New Plex Sign-In',
  newPlexLoginTip: 'Allow Plex users to sign in without first being imported',
  movieRequestLimitLabel: 'Global Movie Request Limit',
  tvRequestLimitLabel: 'Global Series Request Limit',
  defaultPermissions: 'Default Permissions',
  defaultPermissionsTip: 'Initial permissions assigned to new users',
  validationRatingRange: 'Rating must be between 0.1 and 10.0',
  validationMinLessThanMax:
    'Auto-approve rating must be higher than auto-decline rating',
});

const SettingsUsers = () => {
  const { addToast } = useToasts();
  const intl = useIntl();
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<MainSettings>('/api/v1/settings/main');

  const SettingsUsersSchema = Yup.object().shape({
    defaultPermissions: Yup.number(),
    movieTmdbMinRating: Yup.number()
      .min(0.1, intl.formatMessage(messages.validationRatingRange))
      .max(10.0, intl.formatMessage(messages.validationRatingRange))
      .nullable(),
    movieTmdbMaxRating: Yup.number()
      .min(0.1, intl.formatMessage(messages.validationRatingRange))
      .max(10.0, intl.formatMessage(messages.validationRatingRange))
      .nullable()
      .test(
        'max-less-than-min',
        intl.formatMessage(messages.validationMinLessThanMax),
        function (value) {
          const { movieTmdbMinRating } = this.parent;
          if (movieTmdbMinRating && value && value >= movieTmdbMinRating) {
            return false;
          }
          return true;
        }
      ),
    movieTmdb4kMinRating: Yup.number()
      .min(0.1, intl.formatMessage(messages.validationRatingRange))
      .max(10.0, intl.formatMessage(messages.validationRatingRange))
      .nullable(),
    movieTmdb4kMaxRating: Yup.number()
      .min(0.1, intl.formatMessage(messages.validationRatingRange))
      .max(10.0, intl.formatMessage(messages.validationRatingRange))
      .nullable()
      .test(
        'max-less-than-min',
        intl.formatMessage(messages.validationMinLessThanMax),
        function (value) {
          const { movieTmdb4kMinRating } = this.parent;
          if (movieTmdb4kMinRating && value && value >= movieTmdb4kMinRating) {
            return false;
          }
          return true;
        }
      ),
    tvTmdbMinRating: Yup.number()
      .min(0.1, intl.formatMessage(messages.validationRatingRange))
      .max(10.0, intl.formatMessage(messages.validationRatingRange))
      .nullable(),
    tvTmdbMaxRating: Yup.number()
      .min(0.1, intl.formatMessage(messages.validationRatingRange))
      .max(10.0, intl.formatMessage(messages.validationRatingRange))
      .nullable()
      .test(
        'max-less-than-min',
        intl.formatMessage(messages.validationMinLessThanMax),
        function (value) {
          const { tvTmdbMinRating } = this.parent;
          if (tvTmdbMinRating && value && value >= tvTmdbMinRating) {
            return false;
          }
          return true;
        }
      ),
    tvTmdb4kMinRating: Yup.number()
      .min(0.1, intl.formatMessage(messages.validationRatingRange))
      .max(10.0, intl.formatMessage(messages.validationRatingRange))
      .nullable(),
    tvTmdb4kMaxRating: Yup.number()
      .min(0.1, intl.formatMessage(messages.validationRatingRange))
      .max(10.0, intl.formatMessage(messages.validationRatingRange))
      .nullable()
      .test(
        'max-less-than-min',
        intl.formatMessage(messages.validationMinLessThanMax),
        function (value) {
          const { tvTmdb4kMinRating } = this.parent;
          if (tvTmdb4kMinRating && value && value >= tvTmdb4kMinRating) {
            return false;
          }
          return true;
        }
      ),
  });

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.users),
          intl.formatMessage(globalMessages.settings),
        ]}
      />
      <div className="mb-6">
        <h3 className="heading">{intl.formatMessage(messages.userSettings)}</h3>
        <p className="description">
          {intl.formatMessage(messages.userSettingsDescription)}
        </p>
      </div>
      <div className="section">
        <Formik
          initialValues={{
            localLogin: data?.localLogin,
            newPlexLogin: data?.newPlexLogin,
            movieQuotaLimit: data?.defaultQuotas.movie.quotaLimit ?? 0,
            movieQuotaDays: data?.defaultQuotas.movie.quotaDays ?? 7,
            tvQuotaLimit: data?.defaultQuotas.tv.quotaLimit ?? 0,
            tvQuotaDays: data?.defaultQuotas.tv.quotaDays ?? 7,
            defaultPermissions: data?.defaultPermissions ?? 0,
            movieTmdbMinRating: data?.defaultRatings?.movieTmdbMinRating,
            movieTmdbMaxRating: data?.defaultRatings?.movieTmdbMaxRating,
            movieTmdb4kMinRating: data?.defaultRatings?.movieTmdb4kMinRating,
            movieTmdb4kMaxRating: data?.defaultRatings?.movieTmdb4kMaxRating,
            tvTmdbMinRating: data?.defaultRatings?.tvTmdbMinRating,
            tvTmdbMaxRating: data?.defaultRatings?.tvTmdbMaxRating,
            tvTmdb4kMinRating: data?.defaultRatings?.tvTmdb4kMinRating,
            tvTmdb4kMaxRating: data?.defaultRatings?.tvTmdb4kMaxRating,
          }}
          validationSchema={SettingsUsersSchema}
          enableReinitialize
          onSubmit={async (values) => {
            try {
              await axios.post('/api/v1/settings/main', {
                localLogin: values.localLogin,
                newPlexLogin: values.newPlexLogin,
                defaultQuotas: {
                  movie: {
                    quotaLimit: values.movieQuotaLimit,
                    quotaDays: values.movieQuotaDays,
                  },
                  tv: {
                    quotaLimit: values.tvQuotaLimit,
                    quotaDays: values.tvQuotaDays,
                  },
                },
                defaultPermissions: values.defaultPermissions,
                defaultRatings: {
                  movieTmdbMinRating: values.movieTmdbMinRating || undefined,
                  movieTmdbMaxRating: values.movieTmdbMaxRating || undefined,
                  movieTmdb4kMinRating:
                    values.movieTmdb4kMinRating || undefined,
                  movieTmdb4kMaxRating:
                    values.movieTmdb4kMaxRating || undefined,
                  tvTmdbMinRating: values.tvTmdbMinRating || undefined,
                  tvTmdbMaxRating: values.tvTmdbMaxRating || undefined,
                  tvTmdb4kMinRating: values.tvTmdb4kMinRating || undefined,
                  tvTmdb4kMaxRating: values.tvTmdb4kMaxRating || undefined,
                },
              });
              mutate('/api/v1/settings/public');

              addToast(intl.formatMessage(messages.toastSettingsSuccess), {
                autoDismiss: true,
                appearance: 'success',
              });
            } catch (e) {
              addToast(intl.formatMessage(messages.toastSettingsFailure), {
                autoDismiss: true,
                appearance: 'error',
              });
            } finally {
              revalidate();
            }
          }}
        >
          {({ isSubmitting, values, setFieldValue, errors, touched }) => {
            return (
              <Form className="section">
                <div className="form-row">
                  <label htmlFor="localLogin" className="checkbox-label">
                    {intl.formatMessage(messages.localLogin)}
                    <span className="label-tip">
                      {intl.formatMessage(messages.localLoginTip)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <Field
                      type="checkbox"
                      id="localLogin"
                      name="localLogin"
                      onChange={() => {
                        setFieldValue('localLogin', !values.localLogin);
                      }}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="newPlexLogin" className="checkbox-label">
                    {intl.formatMessage(messages.newPlexLogin)}
                    <span className="label-tip">
                      {intl.formatMessage(messages.newPlexLoginTip)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <Field
                      type="checkbox"
                      id="newPlexLogin"
                      name="newPlexLogin"
                      onChange={() => {
                        setFieldValue('newPlexLogin', !values.newPlexLogin);
                      }}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="applicationTitle" className="text-label">
                    {intl.formatMessage(messages.movieRequestLimitLabel)}
                  </label>
                  <div className="form-input-area">
                    <QuotaSelector
                      onChange={setFieldValue}
                      dayFieldName="movieQuotaDays"
                      limitFieldName="movieQuotaLimit"
                      mediaType="movie"
                      defaultDays={values.movieQuotaDays}
                      defaultLimit={values.movieQuotaLimit}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="applicationTitle" className="text-label">
                    {intl.formatMessage(messages.tvRequestLimitLabel)}
                  </label>
                  <div className="form-input-area">
                    <QuotaSelector
                      onChange={setFieldValue}
                      dayFieldName="tvQuotaDays"
                      limitFieldName="tvQuotaLimit"
                      mediaType="tv"
                      defaultDays={values.tvQuotaDays}
                      defaultLimit={values.tvQuotaLimit}
                    />
                  </div>
                </div>
                <div
                  role="group"
                  aria-labelledby="group-label"
                  className="form-group"
                >
                  <div className="form-row">
                    <span id="group-label" className="group-label">
                      {intl.formatMessage(messages.defaultPermissions)}
                      <span className="label-tip">
                        {intl.formatMessage(messages.defaultPermissionsTip)}
                      </span>
                    </span>
                    <div className="form-input-area">
                      <div className="max-w-lg">
                        <PermissionEdit
                          currentPermission={values.defaultPermissions}
                          onUpdate={(newPermissions) =>
                            setFieldValue('defaultPermissions', newPermissions)
                          }
                          values={values}
                          errors={errors}
                          touched={touched}
                          setFieldValue={setFieldValue}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="actions">
                  <div className="flex justify-end">
                    <span className="ml-3 inline-flex rounded-md shadow-sm">
                      <Button
                        buttonType="primary"
                        type="submit"
                        disabled={isSubmitting}
                      >
                        <ArrowDownOnSquareIcon />
                        <span>
                          {isSubmitting
                            ? intl.formatMessage(globalMessages.saving)
                            : intl.formatMessage(globalMessages.save)}
                        </span>
                      </Button>
                    </span>
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </>
  );
};

export default SettingsUsers;
