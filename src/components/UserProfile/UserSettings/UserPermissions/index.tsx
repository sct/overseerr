import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import PermissionEdit from '@app/components/PermissionEdit';
import { useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import Error from '@app/pages/_error';
import { ArrowDownOnSquareIcon } from '@heroicons/react/24/outline';
import type { UserSettingsGeneralResponse } from '@server/interfaces/api/userSettingsInterfaces';
import axios from 'axios';
import { Form, Formik } from 'formik';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import * as Yup from 'yup';

const messages = defineMessages({
  toastSettingsSuccess: 'Permissions saved successfully!',
  toastSettingsFailure: 'Something went wrong while saving settings.',
  permissions: 'Permissions',
  unauthorizedDescription: 'You cannot modify your own permissions.',
  validationRatingRange: 'Rating must be between 0.1 and 10.0',
  validationMinLessThanMax:
    'Auto-approve rating must be higher than auto-decline rating',
});

const UserPermissions = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { user, revalidate: revalidateUser } = useUser({
    id: Number(router.query.userId),
  });
  const {
    data: permissionsData,
    error: permissionsError,
    mutate: revalidatePermissions,
  } = useSWR<{ permissions?: number }>(
    user ? `/api/v1/user/${user?.id}/settings/permissions` : null
  );

  const {
    data: generalData,
    error: generalError,
    mutate: revalidateGeneral,
  } = useSWR<UserSettingsGeneralResponse>(
    user ? `/api/v1/user/${user?.id}/settings/main` : null
  );

  const UserPermissionsSchema = Yup.object()
    .shape({
      currentPermissions: Yup.number().required(),
      // Validation for rating fields - all must be between 0.1 and 10.0
      movieTmdbMinRating: Yup.number()
        .nullable()
        .transform((value, originalValue) =>
          originalValue === '' ? null : value
        )
        .min(0.1, 'Rating must be between 0.1 and 10.0')
        .max(10.0, 'Rating must be between 0.1 and 10.0'),
      movieTmdbMaxRating: Yup.number()
        .nullable()
        .transform((value, originalValue) =>
          originalValue === '' ? null : value
        )
        .min(0.1, 'Rating must be between 0.1 and 10.0')
        .max(10.0, 'Rating must be between 0.1 and 10.0'),
      movieTmdb4kMinRating: Yup.number()
        .nullable()
        .transform((value, originalValue) =>
          originalValue === '' ? null : value
        )
        .min(0.1, 'Rating must be between 0.1 and 10.0')
        .max(10.0, 'Rating must be between 0.1 and 10.0'),
      movieTmdb4kMaxRating: Yup.number()
        .nullable()
        .transform((value, originalValue) =>
          originalValue === '' ? null : value
        )
        .min(0.1, 'Rating must be between 0.1 and 10.0')
        .max(10.0, 'Rating must be between 0.1 and 10.0'),
      tvTmdbMinRating: Yup.number()
        .nullable()
        .transform((value, originalValue) =>
          originalValue === '' ? null : value
        )
        .min(0.1, 'Rating must be between 0.1 and 10.0')
        .max(10.0, 'Rating must be between 0.1 and 10.0'),
      tvTmdbMaxRating: Yup.number()
        .nullable()
        .transform((value, originalValue) =>
          originalValue === '' ? null : value
        )
        .min(0.1, 'Rating must be between 0.1 and 10.0')
        .max(10.0, 'Rating must be between 0.1 and 10.0'),
      tvTmdb4kMinRating: Yup.number()
        .nullable()
        .transform((value, originalValue) =>
          originalValue === '' ? null : value
        )
        .min(0.1, 'Rating must be between 0.1 and 10.0')
        .max(10.0, 'Rating must be between 0.1 and 10.0'),
      tvTmdb4kMaxRating: Yup.number()
        .nullable()
        .transform((value, originalValue) =>
          originalValue === '' ? null : value
        )
        .min(0.1, 'Rating must be between 0.1 and 10.0')
        .max(10.0, 'Rating must be between 0.1 and 10.0'),
    })
    .test(
      'ratings-validation',
      'Auto-approve rating must be higher than auto-decline rating',
      function (values) {
        const errors: string[] = [];

        // Custom validation for rating fields
        if (values && typeof values === 'object') {
          Object.keys(values).forEach((key) => {
            if (key.includes('Rating') && values[key] != null) {
              const rating = Number(values[key]);
              if (rating < 0.1 || rating > 10.0) {
                errors.push(`${key} must be between 0.1 and 10.0`);
              }
            }
          });

          // Validate auto-approve > auto-decline for each category
          const categories = [
            {
              approve: 'movieTmdbMinRating',
              decline: 'movieTmdbMaxRating',
              name: 'Movie HD',
            },
            {
              approve: 'movieTmdb4kMinRating',
              decline: 'movieTmdb4kMaxRating',
              name: 'Movie 4K',
            },
            {
              approve: 'tvTmdbMinRating',
              decline: 'tvTmdbMaxRating',
              name: 'TV HD',
            },
            {
              approve: 'tvTmdb4kMinRating',
              decline: 'tvTmdb4kMaxRating',
              name: 'TV 4K',
            },
          ];

          categories.forEach(({ approve, decline, name }) => {
            const approveRating = values[approve];
            const declineRating = values[decline];

            if (
              approveRating != null &&
              declineRating != null &&
              approveRating <= declineRating
            ) {
              errors.push(
                `${name}: Auto-approve rating must be higher than auto-decline rating`
              );
            }
          });
        }

        if (errors.length > 0) {
          return this.createError({ message: errors[0] }); // Return first error instead of throwing multiple
        }

        return true;
      }
    );

  if (
    (!permissionsData && !permissionsError) ||
    (!generalData && !generalError)
  ) {
    return <LoadingSpinner />;
  }

  if (!permissionsData || !generalData) {
    return <Error statusCode={500} />;
  }

  if (currentUser?.id !== 1 && currentUser?.id === user?.id) {
    return (
      <>
        <div className="mb-6">
          <h3 className="heading">
            {intl.formatMessage(messages.permissions)}
          </h3>
        </div>
        <Alert
          title={intl.formatMessage(messages.unauthorizedDescription)}
          type="error"
        />
      </>
    );
  }

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.permissions),
          intl.formatMessage(globalMessages.usersettings),
          user?.displayName,
        ]}
      />
      <div className="mb-6">
        <h3 className="heading">{intl.formatMessage(messages.permissions)}</h3>
      </div>
      <Formik
        initialValues={{
          currentPermissions: permissionsData?.permissions,
          movieTmdbMinRating: generalData?.movieTmdbMinRating,
          movieTmdbMaxRating: generalData?.movieTmdbMaxRating,
          movieTmdb4kMinRating: generalData?.movieTmdb4kMinRating,
          movieTmdb4kMaxRating: generalData?.movieTmdb4kMaxRating,
          tvTmdbMinRating: generalData?.tvTmdbMinRating,
          tvTmdbMaxRating: generalData?.tvTmdbMaxRating,
          tvTmdb4kMinRating: generalData?.tvTmdb4kMinRating,
          tvTmdb4kMaxRating: generalData?.tvTmdb4kMaxRating,
        }}
        validationSchema={UserPermissionsSchema}
        enableReinitialize
        onSubmit={async (values) => {
          try {
            // Update permissions
            await axios.post(`/api/v1/user/${user?.id}/settings/permissions`, {
              permissions: values.currentPermissions ?? 0,
            });

            // Update rating settings
            await axios.post(`/api/v1/user/${user?.id}/settings/main`, {
              movieTmdbMinRating: values.movieTmdbMinRating || undefined,
              movieTmdbMaxRating: values.movieTmdbMaxRating || undefined,
              movieTmdb4kMinRating: values.movieTmdb4kMinRating || undefined,
              movieTmdb4kMaxRating: values.movieTmdb4kMaxRating || undefined,
              tvTmdbMinRating: values.tvTmdbMinRating || undefined,
              tvTmdbMaxRating: values.tvTmdbMaxRating || undefined,
              tvTmdb4kMinRating: values.tvTmdb4kMinRating || undefined,
              tvTmdb4kMaxRating: values.tvTmdb4kMaxRating || undefined,
            });

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
            revalidatePermissions();
            revalidateGeneral();
            revalidateUser();
          }
        }}
      >
        {({ isSubmitting, setFieldValue, values, errors, touched }) => {
          return (
            <Form className="section">
              <div className="max-w-3xl">
                <PermissionEdit
                  actingUser={currentUser}
                  currentUser={user}
                  currentPermission={values.currentPermissions ?? 0}
                  onUpdate={(newPermission) =>
                    setFieldValue('currentPermissions', newPermission)
                  }
                  values={values}
                  errors={errors}
                  touched={touched}
                  setFieldValue={setFieldValue}
                />
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
    </>
  );
};

export default UserPermissions;
