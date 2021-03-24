import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useRouter } from 'next/router';
import React, { useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import { UserSettingsGeneralResponse } from '../../../../../server/interfaces/api/userSettingsInterfaces';
import { Language } from '../../../../../server/lib/settings';
import useSettings from '../../../../hooks/useSettings';
import { Permission, UserType, useUser } from '../../../../hooks/useUser';
import globalMessages from '../../../../i18n/globalMessages';
import Error from '../../../../pages/_error';
import Badge from '../../../Common/Badge';
import Button from '../../../Common/Button';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import PageTitle from '../../../Common/PageTitle';
import QuotaSelector from '../../../QuotaSelector';
import RegionSelector from '../../../RegionSelector';

const messages = defineMessages({
  general: 'General',
  generalsettings: 'General Settings',
  displayName: 'Display Name',
  save: 'Save Changes',
  saving: 'Saving…',
  accounttype: 'Account Type',
  plexuser: 'Plex User',
  localuser: 'Local User',
  role: 'Role',
  owner: 'Owner',
  admin: 'Admin',
  user: 'User',
  toastSettingsSuccess: 'Settings saved successfully!',
  toastSettingsFailure: 'Something went wrong while saving settings.',
  region: 'Discover Region',
  regionTip: 'Filter content by regional availability',
  originallanguage: 'Discover Language',
  originallanguageTip: 'Filter content by original language',
  originalLanguageDefault: 'All Languages',
  languageServerDefault: 'Default ({language})',
  movierequestlimit: 'Movie Request Limit',
  seriesrequestlimit: 'Series Request Limit',
  enableOverride: 'Enable Override',
});

const UserGeneralSettings: React.FC = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const [movieQuotaEnabled, setMovieQuotaEnabled] = useState(false);
  const [tvQuotaEnabled, setTvQuotaEnabled] = useState(false);
  const router = useRouter();
  const { user, hasPermission, mutate } = useUser({
    id: Number(router.query.userId),
  });
  const { hasPermission: currentHasPermission } = useUser();
  const { currentSettings } = useSettings();
  const { data, error, revalidate } = useSWR<UserSettingsGeneralResponse>(
    user ? `/api/v1/user/${user?.id}/settings/main` : null
  );

  const { data: languages, error: languagesError } = useSWR<Language[]>(
    '/api/v1/languages'
  );

  const sortedLanguages = useMemo(
    () =>
      languages?.sort((lang1, lang2) => {
        const lang1Name =
          intl.formatDisplayName(lang1.iso_639_1, {
            type: 'language',
            fallback: 'none',
          }) ?? lang1.english_name;
        const lang2Name =
          intl.formatDisplayName(lang2.iso_639_1, {
            type: 'language',
            fallback: 'none',
          }) ?? lang2.english_name;

        return lang1Name === lang2Name ? 0 : lang1Name > lang2Name ? 1 : -1;
      }),
    [intl, languages]
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!languages && !languagesError) {
    return <LoadingSpinner />;
  }

  if (!data || !languages) {
    return <Error statusCode={500} />;
  }

  const defaultLanguageNameFallback =
    languages.find(
      (language) => language.iso_639_1 === currentSettings.originalLanguage
    )?.english_name ?? currentSettings.originalLanguage;

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.general),
          intl.formatMessage(globalMessages.usersettings),
        ]}
      />
      <div className="mb-6">
        <h3 className="heading">
          {intl.formatMessage(messages.generalsettings)}
        </h3>
      </div>
      <Formik
        initialValues={{
          displayName: data?.username,
          region: data?.region,
          originalLanguage: data?.originalLanguage,
          movieQuotaLimit: data?.movieQuotaLimit,
          movieQuotaDays: data?.movieQuotaDays,
          tvQuotaLimit: data?.tvQuotaLimit,
          tvQuotaDays: data?.tvQuotaDays,
        }}
        enableReinitialize
        onSubmit={async (values) => {
          try {
            await axios.post(`/api/v1/user/${user?.id}/settings/main`, {
              username: values.displayName,
              region: values.region,
              originalLanguage: values.originalLanguage,
              movieQuotaLimit: movieQuotaEnabled
                ? values.movieQuotaLimit
                : null,
              movieQuotaDays: movieQuotaEnabled ? values.movieQuotaDays : null,
              tvQuotaLimit: tvQuotaEnabled ? values.tvQuotaLimit : null,
              tvQuotaDays: tvQuotaEnabled ? values.tvQuotaDays : null,
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
            revalidate();
            mutate();
          }
        }}
      >
        {({ errors, touched, isSubmitting, values, setFieldValue }) => {
          return (
            <Form className="section">
              <div className="form-row">
                <div className="text-label">
                  {intl.formatMessage(messages.accounttype)}
                </div>
                <div className="mb-1 text-sm font-medium leading-5 text-gray-400 sm:mt-2">
                  <div className="flex items-center max-w-lg">
                    {user?.userType === UserType.PLEX ? (
                      <Badge badgeType="warning">
                        {intl.formatMessage(messages.plexuser)}
                      </Badge>
                    ) : (
                      <Badge badgeType="default">
                        {intl.formatMessage(messages.localuser)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="text-label">
                  {intl.formatMessage(messages.role)}
                </div>
                <div className="mb-1 text-sm font-medium leading-5 text-gray-400 sm:mt-2">
                  <div className="flex items-center max-w-lg">
                    {user?.id === 1
                      ? intl.formatMessage(messages.owner)
                      : hasPermission(Permission.ADMIN)
                      ? intl.formatMessage(messages.admin)
                      : intl.formatMessage(messages.user)}
                  </div>
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="displayName" className="text-label">
                  {intl.formatMessage(messages.displayName)}
                </label>
                <div className="form-input">
                  <div className="form-input-field">
                    <Field
                      id="displayName"
                      name="displayName"
                      type="text"
                      placeholder={user?.displayName}
                    />
                  </div>
                  {errors.displayName && touched.displayName && (
                    <div className="error">{errors.displayName}</div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="displayName" className="text-label">
                  <span>{intl.formatMessage(messages.region)}</span>
                  <span className="label-tip">
                    {intl.formatMessage(messages.regionTip)}
                  </span>
                </label>
                <div className="form-input">
                  <RegionSelector
                    name="region"
                    value={values.region ?? ''}
                    isUserSetting
                    onChange={setFieldValue}
                  />
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="originalLanguage" className="text-label">
                  <span>{intl.formatMessage(messages.originallanguage)}</span>
                  <span className="label-tip">
                    {intl.formatMessage(messages.originallanguageTip)}
                  </span>
                </label>
                <div className="form-input">
                  <div className="form-input-field">
                    <Field
                      as="select"
                      id="originalLanguage"
                      name="originalLanguage"
                    >
                      <option value="">
                        {intl.formatMessage(messages.languageServerDefault, {
                          language: currentSettings.originalLanguage
                            ? intl.formatDisplayName(
                                currentSettings.originalLanguage,
                                {
                                  type: 'language',
                                  fallback: 'none',
                                }
                              ) ?? defaultLanguageNameFallback
                            : intl.formatMessage(
                                messages.originalLanguageDefault
                              ),
                        })}
                      </option>
                      <option value="all">
                        {intl.formatMessage(messages.originalLanguageDefault)}
                      </option>
                      {sortedLanguages?.map((language) => (
                        <option
                          key={`language-key-${language.iso_639_1}`}
                          value={language.iso_639_1}
                        >
                          {intl.formatDisplayName(language.iso_639_1, {
                            type: 'language',
                            fallback: 'none',
                          }) ?? language.english_name}
                        </option>
                      ))}
                    </Field>
                  </div>
                </div>
              </div>
              {currentHasPermission(Permission.MANAGE_USERS) &&
                !hasPermission(Permission.MANAGE_USERS) && (
                  <>
                    <div className="form-row">
                      <label htmlFor="movieQuotaLimit" className="text-label">
                        <span>
                          {intl.formatMessage(messages.movierequestlimit)}
                        </span>
                      </label>
                      <div className="form-input">
                        <div className="flex flex-col">
                          <div className="flex items-center mb-4">
                            <input
                              type="checkbox"
                              checked={movieQuotaEnabled}
                              onChange={() => setMovieQuotaEnabled((s) => !s)}
                            />
                            <span className="ml-2 text-gray-300">
                              {intl.formatMessage(messages.enableOverride)}
                            </span>
                          </div>
                          <QuotaSelector
                            isDisabled={!movieQuotaEnabled}
                            dayFieldName="movieQuotaDays"
                            limitFieldName="movieQuotaLimit"
                            mediaType="movie"
                            onChange={setFieldValue}
                            defaultDays={values.movieQuotaDays}
                            defaultLimit={values.movieQuotaLimit}
                            dayOverride={
                              !movieQuotaEnabled
                                ? data?.globalMovieQuotaDays
                                : undefined
                            }
                            limitOverride={
                              !movieQuotaEnabled
                                ? data?.globalMovieQuotaLimit
                                : undefined
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="form-row">
                      <label htmlFor="tvQuotaLimit" className="text-label">
                        <span>
                          {intl.formatMessage(messages.seriesrequestlimit)}
                        </span>
                      </label>
                      <div className="form-input">
                        <div className="flex flex-col">
                          <div className="flex items-center mb-4">
                            <input
                              type="checkbox"
                              checked={tvQuotaEnabled}
                              onChange={() => setTvQuotaEnabled((s) => !s)}
                            />
                            <span className="ml-2 text-gray-300">
                              {intl.formatMessage(messages.enableOverride)}
                            </span>
                          </div>
                          <QuotaSelector
                            isDisabled={!tvQuotaEnabled}
                            dayFieldName="tvQuotaDays"
                            limitFieldName="tvQuotaLimit"
                            mediaType="tv"
                            onChange={setFieldValue}
                            defaultDays={values.tvQuotaDays}
                            defaultLimit={values.tvQuotaLimit}
                            dayOverride={
                              !tvQuotaEnabled
                                ? data?.globalTvQuotaDays
                                : undefined
                            }
                            limitOverride={
                              !tvQuotaEnabled
                                ? data?.globalTvQuotaLimit
                                : undefined
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              <div className="actions">
                <div className="flex justify-end">
                  <span className="inline-flex ml-3 rounded-md shadow-sm">
                    <Button
                      buttonType="primary"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? intl.formatMessage(messages.saving)
                        : intl.formatMessage(messages.save)}
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

export default UserGeneralSettings;
