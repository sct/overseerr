import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import Modal from '@app/components/Common/Modal';
import PageTitle from '@app/components/Common/PageTitle';
import IssueComment from '@app/components/IssueDetails/IssueComment';
import IssueDescription from '@app/components/IssueDetails/IssueDescription';
import { issueOptions } from '@app/components/IssueModal/constants';
import useDeepLinks from '@app/hooks/useDeepLinks';
import { Permission, useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import Error from '@app/pages/_error';
import { Transition } from '@headlessui/react';
import {
  ChatBubbleOvalLeftEllipsisIcon,
  CheckCircleIcon,
  PlayIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import { IssueStatus } from '@server/constants/issue';
import { MediaType } from '@server/constants/media';
import type Issue from '@server/entity/Issue';
import type { MovieDetails } from '@server/models/Movie';
import type { TvDetails } from '@server/models/Tv';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { defineMessages, FormattedRelativeTime, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import * as Yup from 'yup';

const messages = defineMessages({
  openedby: '#{issueId} opened {relativeTime} by {username}',
  closeissue: 'Close Issue',
  closeissueandcomment: 'Close with Comment',
  leavecomment: 'Comment',
  comments: 'Comments',
  reopenissue: 'Reopen Issue',
  reopenissueandcomment: 'Reopen with Comment',
  issuepagetitle: 'Issue',
  playonplex: 'Play on Plex',
  play4konplex: 'Play in 4K on Plex',
  openinarr: 'Open in {arr}',
  openin4karr: 'Open in 4K {arr}',
  toasteditdescriptionsuccess: 'Issue description edited successfully!',
  toasteditdescriptionfailed:
    'Something went wrong while editing the issue description.',
  toaststatusupdated: 'Issue status updated successfully!',
  toaststatusupdatefailed:
    'Something went wrong while updating the issue status.',
  issuetype: 'Type',
  lastupdated: 'Last Updated',
  problemseason: 'Affected Season',
  allseasons: 'All Seasons',
  season: 'Season {seasonNumber}',
  problemepisode: 'Affected Episode',
  allepisodes: 'All Episodes',
  episode: 'Episode {episodeNumber}',
  deleteissue: 'Delete Issue',
  deleteissueconfirm: 'Are you sure you want to delete this issue?',
  toastissuedeleted: 'Issue deleted successfully!',
  toastissuedeletefailed: 'Something went wrong while deleting the issue.',
  nocomments: 'No comments.',
  unknownissuetype: 'Unknown',
  commentplaceholder: 'Add a comment…',
});

const isMovie = (movie: MovieDetails | TvDetails): movie is MovieDetails => {
  return (movie as MovieDetails).title !== undefined;
};

const IssueDetails = () => {
  const { addToast } = useToasts();
  const router = useRouter();
  const intl = useIntl();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { user: currentUser, hasPermission } = useUser();
  const { data: issueData, mutate: revalidateIssue } = useSWR<Issue>(
    `/api/v1/issue/${router.query.issueId}`
  );
  const { data, error } = useSWR<MovieDetails | TvDetails>(
    issueData?.media.tmdbId
      ? `/api/v1/${issueData.media.mediaType}/${issueData.media.tmdbId}`
      : null
  );

  const { plexUrl, plexUrl4k } = useDeepLinks({
    plexUrl: data?.mediaInfo?.plexUrl,
    plexUrl4k: data?.mediaInfo?.plexUrl4k,
    iOSPlexUrl: data?.mediaInfo?.iOSPlexUrl,
    iOSPlexUrl4k: data?.mediaInfo?.iOSPlexUrl4k,
  });

  const CommentSchema = Yup.object().shape({
    message: Yup.string().required(),
  });

  const issueOption = issueOptions.find(
    (opt) => opt.issueType === issueData?.issueType
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data || !issueData) {
    return <Error statusCode={404} />;
  }

  const belongsToUser = issueData.createdBy.id === currentUser?.id;

  const [firstComment, ...otherComments] = issueData.comments;

  const editFirstComment = async (newMessage: string) => {
    try {
      await axios.put(`/api/v1/issueComment/${firstComment.id}`, {
        message: newMessage,
      });

      addToast(intl.formatMessage(messages.toasteditdescriptionsuccess), {
        appearance: 'success',
        autoDismiss: true,
      });
      revalidateIssue();
    } catch (e) {
      addToast(intl.formatMessage(messages.toasteditdescriptionfailed), {
        appearance: 'error',
        autoDismiss: true,
      });
    }
  };

  const updateIssueStatus = async (newStatus: 'open' | 'resolved') => {
    try {
      await axios.post(`/api/v1/issue/${issueData.id}/${newStatus}`);

      addToast(intl.formatMessage(messages.toaststatusupdated), {
        appearance: 'success',
        autoDismiss: true,
      });
      revalidateIssue();
    } catch (e) {
      addToast(intl.formatMessage(messages.toaststatusupdatefailed), {
        appearance: 'error',
        autoDismiss: true,
      });
    }
  };

  const deleteIssue = async () => {
    try {
      await axios.delete(`/api/v1/issue/${issueData.id}`);

      addToast(intl.formatMessage(messages.toastissuedeleted), {
        appearance: 'success',
        autoDismiss: true,
      });
      router.push('/issues');
    } catch (e) {
      addToast(intl.formatMessage(messages.toastissuedeletefailed), {
        appearance: 'error',
        autoDismiss: true,
      });
    }
  };

  const title = isMovie(data) ? data.title : data.name;
  const releaseYear = isMovie(data) ? data.releaseDate : data.firstAirDate;

  return (
    <div
      className="media-page"
      style={{
        height: 493,
      }}
    >
      <PageTitle title={[intl.formatMessage(messages.issuepagetitle), title]} />
      <Transition
        as="div"
        enter="transition opacity-0 duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition opacity-100 duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        show={showDeleteModal}
      >
        <Modal
          title={intl.formatMessage(messages.deleteissue)}
          onCancel={() => setShowDeleteModal(false)}
          onOk={() => deleteIssue()}
          okText={intl.formatMessage(messages.deleteissue)}
          okButtonType="danger"
        >
          {intl.formatMessage(messages.deleteissueconfirm)}
        </Modal>
      </Transition>
      {data.backdropPath && (
        <div className="media-page-bg-image">
          <CachedImage
            alt=""
            src={`https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/${data.backdropPath}`}
            layout="fill"
            objectFit="cover"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(180deg, rgba(17, 24, 39, 0.47) 0%, rgba(17, 24, 39, 1) 100%)',
            }}
          />
        </div>
      )}
      <div className="media-header">
        <div className="media-poster">
          <CachedImage
            src={
              data.posterPath
                ? `https://image.tmdb.org/t/p/w600_and_h900_bestv2${data.posterPath}`
                : '/images/overseerr_poster_not_found.png'
            }
            alt=""
            layout="responsive"
            width={600}
            height={900}
            priority
          />
        </div>
        <div className="media-title">
          <div className="media-status">
            {issueData.status === IssueStatus.OPEN && (
              <Badge badgeType="warning">
                {intl.formatMessage(globalMessages.open)}
              </Badge>
            )}
            {issueData.status === IssueStatus.RESOLVED && (
              <Badge badgeType="success">
                {intl.formatMessage(globalMessages.resolved)}
              </Badge>
            )}
          </div>
          <h1>
            <Link
              href={`/${
                issueData.media.mediaType === MediaType.MOVIE ? 'movie' : 'tv'
              }/${data.id}`}
            >
              <a className="hover:underline">{title}</a>
            </Link>{' '}
            {releaseYear && (
              <span className="media-year">({releaseYear.slice(0, 4)})</span>
            )}
          </h1>
          <span className="media-attributes">
            {intl.formatMessage(messages.openedby, {
              issueId: issueData.id,
              username: (
                <Link
                  href={
                    belongsToUser
                      ? '/profile'
                      : `/users/${issueData.createdBy.id}`
                  }
                >
                  <a className="group ml-1 inline-flex h-full items-center xl:ml-1.5">
                    <img
                      className="mr-0.5 h-5 w-5 scale-100 transform-gpu rounded-full object-cover transition duration-300 group-hover:scale-105 xl:mr-1 xl:h-6 xl:w-6"
                      src={issueData.createdBy.avatar}
                      alt=""
                    />
                    <span className="font-semibold text-gray-100 transition duration-300 group-hover:text-white group-hover:underline">
                      {issueData.createdBy.displayName}
                    </span>
                  </a>
                </Link>
              ),
              relativeTime: (
                <FormattedRelativeTime
                  value={Math.floor(
                    (new Date(issueData.createdAt).getTime() - Date.now()) /
                      1000
                  )}
                  updateIntervalInSeconds={1}
                  numeric="auto"
                />
              ),
            })}
          </span>
        </div>
      </div>
      <div className="relative z-10 mt-6 flex text-gray-300">
        <div className="flex-1 lg:pr-4">
          <IssueDescription
            description={firstComment.message}
            belongsToUser={belongsToUser}
            commentCount={otherComments.length}
            onEdit={(newMessage) => {
              editFirstComment(newMessage);
            }}
            onDelete={() => setShowDeleteModal(true)}
          />
          <div className="mt-8 lg:hidden">
            <div className="media-facts">
              <div className="media-fact">
                <span>{intl.formatMessage(messages.issuetype)}</span>
                <span className="media-fact-value">
                  {intl.formatMessage(
                    issueOption?.name ?? messages.unknownissuetype
                  )}
                </span>
              </div>
              {issueData.media.mediaType === MediaType.TV && (
                <>
                  <div className="media-fact">
                    <span>{intl.formatMessage(messages.problemseason)}</span>
                    <span className="media-fact-value">
                      {intl.formatMessage(
                        issueData.problemSeason > 0
                          ? messages.season
                          : messages.allseasons,
                        { seasonNumber: issueData.problemSeason }
                      )}
                    </span>
                  </div>
                  {issueData.problemSeason > 0 && (
                    <div className="media-fact">
                      <span>{intl.formatMessage(messages.problemepisode)}</span>
                      <span className="media-fact-value">
                        {intl.formatMessage(
                          issueData.problemEpisode > 0
                            ? messages.episode
                            : messages.allepisodes,
                          { episodeNumber: issueData.problemEpisode }
                        )}
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="media-fact">
                <span>{intl.formatMessage(messages.lastupdated)}</span>
                <span className="media-fact-value">
                  <FormattedRelativeTime
                    value={Math.floor(
                      (new Date(issueData.updatedAt).getTime() - Date.now()) /
                        1000
                    )}
                    updateIntervalInSeconds={1}
                    numeric="auto"
                  />
                </span>
              </div>
            </div>
            <div className="mt-4 mb-6 flex flex-col space-y-2">
              {issueData?.media.plexUrl && (
                <Button
                  as="a"
                  href={plexUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full"
                  buttonType="ghost"
                >
                  <PlayIcon />
                  <span>{intl.formatMessage(messages.playonplex)}</span>
                </Button>
              )}
              {issueData?.media.serviceUrl &&
                hasPermission(Permission.ADMIN) && (
                  <Button
                    as="a"
                    href={issueData?.media.serviceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full"
                    buttonType="ghost"
                  >
                    <ServerIcon />
                    <span>
                      {intl.formatMessage(messages.openinarr, {
                        arr:
                          issueData.media.mediaType === MediaType.MOVIE
                            ? 'Radarr'
                            : 'Sonarr',
                      })}
                    </span>
                  </Button>
                )}
              {issueData?.media.plexUrl4k && (
                <Button
                  as="a"
                  href={plexUrl4k}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full"
                  buttonType="ghost"
                >
                  <PlayIcon />
                  <span>{intl.formatMessage(messages.play4konplex)}</span>
                </Button>
              )}
              {issueData?.media.serviceUrl4k &&
                hasPermission(Permission.ADMIN) && (
                  <Button
                    as="a"
                    href={issueData?.media.serviceUrl4k}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full"
                    buttonType="ghost"
                  >
                    <ServerIcon />
                    <span>
                      {intl.formatMessage(messages.openin4karr, {
                        arr:
                          issueData.media.mediaType === MediaType.MOVIE
                            ? 'Radarr'
                            : 'Sonarr',
                      })}
                    </span>
                  </Button>
                )}
            </div>
          </div>
          <div className="mt-6">
            <div className="font-semibold text-gray-100 lg:text-xl">
              {intl.formatMessage(messages.comments)}
            </div>
            {otherComments.map((comment) => (
              <IssueComment
                comment={comment}
                key={`issue-comment-${comment.id}`}
                isReversed={issueData.createdBy.id === comment.user.id}
                isActiveUser={comment.user.id === currentUser?.id}
                onUpdate={() => revalidateIssue()}
              />
            ))}
            {otherComments.length === 0 && (
              <div className="mt-4 mb-10 text-gray-400">
                <span>{intl.formatMessage(messages.nocomments)}</span>
              </div>
            )}
            {(hasPermission(Permission.MANAGE_ISSUES) || belongsToUser) && (
              <Formik
                initialValues={{
                  message: '',
                }}
                validationSchema={CommentSchema}
                onSubmit={async (values, { resetForm }) => {
                  await axios.post(`/api/v1/issue/${issueData?.id}/comment`, {
                    message: values.message,
                  });
                  revalidateIssue();
                  resetForm();
                }}
              >
                {({ isValid, isSubmitting, values, handleSubmit }) => {
                  return (
                    <Form>
                      <div className="my-6">
                        <Field
                          id="message"
                          name="message"
                          as="textarea"
                          placeholder={intl.formatMessage(
                            messages.commentplaceholder
                          )}
                          className="h-20"
                        />
                        <div className="mt-4 flex items-center justify-end space-x-2">
                          {(hasPermission(Permission.MANAGE_ISSUES) ||
                            belongsToUser) && (
                            <>
                              {issueData.status === IssueStatus.OPEN ? (
                                <Button
                                  type="button"
                                  buttonType="danger"
                                  onClick={async () => {
                                    await updateIssueStatus('resolved');

                                    if (values.message) {
                                      handleSubmit();
                                    }
                                  }}
                                >
                                  <CheckCircleIcon />
                                  <span>
                                    {intl.formatMessage(
                                      values.message
                                        ? messages.closeissueandcomment
                                        : messages.closeissue
                                    )}
                                  </span>
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  buttonType="default"
                                  onClick={async () => {
                                    await updateIssueStatus('open');

                                    if (values.message) {
                                      handleSubmit();
                                    }
                                  }}
                                >
                                  <ArrowPathIcon />
                                  <span>
                                    {intl.formatMessage(
                                      values.message
                                        ? messages.reopenissueandcomment
                                        : messages.reopenissue
                                    )}
                                  </span>
                                </Button>
                              )}
                            </>
                          )}
                          <Button
                            type="submit"
                            buttonType="primary"
                            disabled={
                              !isValid || isSubmitting || !values.message
                            }
                          >
                            <ChatBubbleOvalLeftEllipsisIcon />
                            <span>
                              {intl.formatMessage(messages.leavecomment)}
                            </span>
                          </Button>
                        </div>
                      </div>
                    </Form>
                  );
                }}
              </Formik>
            )}
          </div>
        </div>
        <div className="hidden lg:block lg:w-80 lg:pl-4">
          <div className="media-facts">
            <div className="media-fact">
              <span>{intl.formatMessage(messages.issuetype)}</span>
              <span className="media-fact-value">
                {intl.formatMessage(
                  issueOption?.name ?? messages.unknownissuetype
                )}
              </span>
            </div>
            {issueData.media.mediaType === MediaType.TV && (
              <>
                <div className="media-fact">
                  <span>{intl.formatMessage(messages.problemseason)}</span>
                  <span className="media-fact-value">
                    {intl.formatMessage(
                      issueData.problemSeason > 0
                        ? messages.season
                        : messages.allseasons,
                      { seasonNumber: issueData.problemSeason }
                    )}
                  </span>
                </div>
                {issueData.problemSeason > 0 && (
                  <div className="media-fact">
                    <span>{intl.formatMessage(messages.problemepisode)}</span>
                    <span className="media-fact-value">
                      {intl.formatMessage(
                        issueData.problemEpisode > 0
                          ? messages.episode
                          : messages.allepisodes,
                        { episodeNumber: issueData.problemEpisode }
                      )}
                    </span>
                  </div>
                )}
              </>
            )}
            <div className="media-fact">
              <span>{intl.formatMessage(messages.lastupdated)}</span>
              <span className="media-fact-value">
                <FormattedRelativeTime
                  value={Math.floor(
                    (new Date(issueData.updatedAt).getTime() - Date.now()) /
                      1000
                  )}
                  updateIntervalInSeconds={1}
                  numeric="auto"
                />
              </span>
            </div>
          </div>
          <div className="mt-4 mb-6 flex flex-col space-y-2">
            {issueData?.media.plexUrl && (
              <Button
                as="a"
                href={plexUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full"
                buttonType="ghost"
              >
                <PlayIcon />
                <span>{intl.formatMessage(messages.playonplex)}</span>
              </Button>
            )}
            {issueData?.media.serviceUrl && hasPermission(Permission.ADMIN) && (
              <Button
                as="a"
                href={issueData?.media.serviceUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full"
                buttonType="ghost"
              >
                <ServerIcon />
                <span>
                  {intl.formatMessage(messages.openinarr, {
                    arr:
                      issueData.media.mediaType === MediaType.MOVIE
                        ? 'Radarr'
                        : 'Sonarr',
                  })}
                </span>
              </Button>
            )}
            {issueData?.media.plexUrl4k && (
              <Button
                as="a"
                href={plexUrl4k}
                target="_blank"
                rel="noreferrer"
                className="w-full"
                buttonType="ghost"
              >
                <PlayIcon />
                <span>{intl.formatMessage(messages.play4konplex)}</span>
              </Button>
            )}
            {issueData?.media.serviceUrl4k &&
              hasPermission(Permission.ADMIN) && (
                <Button
                  as="a"
                  href={issueData?.media.serviceUrl4k}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full"
                  buttonType="ghost"
                >
                  <ServerIcon />
                  <span>
                    {intl.formatMessage(messages.openin4karr, {
                      arr:
                        issueData.media.mediaType === MediaType.MOVIE
                          ? 'Radarr'
                          : 'Sonarr',
                    })}
                  </span>
                </Button>
              )}
          </div>
        </div>
      </div>
      <div className="extra-bottom-space" />
    </div>
  );
};

export default IssueDetails;
