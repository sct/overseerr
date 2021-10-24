import {
  ChatIcon,
  CheckCircleIcon,
  ExclamationIcon,
  ExternalLinkIcon,
} from '@heroicons/react/outline';
import { RefreshIcon } from '@heroicons/react/solid';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { defineMessages, FormattedRelativeTime, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import * as Yup from 'yup';
import { IssueStatus } from '../../../server/constants/issue';
import { MediaType } from '../../../server/constants/media';
import type Issue from '../../../server/entity/Issue';
import type { MovieDetails } from '../../../server/models/Movie';
import type { TvDetails } from '../../../server/models/Tv';
import { Permission, useUser } from '../../hooks/useUser';
import globalMessages from '../../i18n/globalMessages';
import Error from '../../pages/_error';
import Badge from '../Common/Badge';
import Button from '../Common/Button';
import CachedImage from '../Common/CachedImage';
import LoadingSpinner from '../Common/LoadingSpinner';
import Modal from '../Common/Modal';
import PageTitle from '../Common/PageTitle';
import { issueOptions } from '../IssueModal/constants';
import Transition from '../Transition';
import IssueComment from './IssueComment';
import IssueDescription from './IssueDescription';

const messages = defineMessages({
  openedby:
    '#{issueId} opened {relativeTime} by <UserLink>{username}</UserLink>',
  closeissue: 'Close Issue',
  closeissueandcomment: 'Close with Comment',
  leavecomment: 'Comment',
  comments: 'Comments',
  reopenissue: 'Reopen Issue',
  reopenissueandcomment: 'Reopen with Comment',
  issuepagetitle: 'Issue',
  openinradarr: 'Open in Radarr',
  openinsonarr: 'Open in Sonarr',
  toasteditdescriptionsuccess: 'Successfully edited the issue description.',
  toasteditdescriptionfailed: 'Something went wrong editing the description.',
  toaststatusupdated: 'Issue status updated.',
  toaststatusupdatefailed: 'Something went wrong updating the issue status.',
  issuetype: 'Issue Type',
  mediatype: 'Media Type',
  lastupdated: 'Last Updated',
  statusopen: 'Open',
  statusresolved: 'Resolved',
  problemseason: 'Affected Season',
  allseasons: 'All Seasons',
  season: 'Season {seasonNumber}',
  problemepisode: 'Affected Episode',
  allepisodes: 'All Episodes',
  episode: 'Episode {episodeNumber}',
  deleteissue: 'Delete Issue',
  deleteissueconfirm: 'Are you sure you want to delete this issue?',
  toastissuedeleted: 'Issue deleted succesfully.',
  toastissuedeletefailed: 'Something went wrong deleting the issue.',
  nocomments: 'No comments.',
  unknownissuetype: 'Unknown',
});

const isMovie = (movie: MovieDetails | TvDetails): movie is MovieDetails => {
  return (movie as MovieDetails).title !== undefined;
};

const IssueDetails: React.FC = () => {
  const { addToast } = useToasts();
  const router = useRouter();
  const intl = useIntl();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { user: currentUser, hasPermission } = useUser();
  const { data: issueData, revalidate: revalidateIssue } = useSWR<Issue>(
    `/api/v1/issue/${router.query.issueId}`
  );
  const { data, error } = useSWR<MovieDetails | TvDetails>(
    issueData?.media.tmdbId
      ? `/api/v1/${issueData.media.mediaType}/${issueData.media.tmdbId}`
      : null
  );

  const CommentSchema = Yup.object().shape({
    message: Yup.string().required(),
  });

  const issueOption = issueOptions.find(
    (opt) => opt.issueType === issueData?.issueType
  );

  const mediaType = issueData?.media.mediaType;

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
      <PageTitle
        title={[
          intl.formatMessage(messages.issuepagetitle),
          isMovie(data) ? data.title : data.name,
        ]}
      />
      <Transition
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
          iconSvg={<ExclamationIcon />}
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
      <div className="flex flex-col items-center pt-4 lg:items-end lg:flex-row">
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
              <Badge badgeType="primary">
                {intl.formatMessage(messages.statusopen)}
              </Badge>
            )}
            {issueData.status === IssueStatus.RESOLVED && (
              <Badge badgeType="success">
                {intl.formatMessage(messages.statusresolved)}
              </Badge>
            )}
          </div>
          <h1>
            <Link
              href={`/${
                issueData.media.mediaType === MediaType.MOVIE ? 'movie' : 'tv'
              }/${data.id}`}
            >
              <a className="hover:underline">
                {title}{' '}
                {releaseYear && (
                  <span className="media-year">
                    ({releaseYear.slice(0, 4)})
                  </span>
                )}
              </a>
            </Link>
          </h1>
          <span className="media-attributes">
            {intl.formatMessage(messages.openedby, {
              issueId: issueData.id,
              username: issueData.createdBy.displayName,
              UserLink: function UserLink(msg) {
                return (
                  <div className="inline-flex items-center h-full mx-1">
                    <Link href={`/users/${issueData.createdBy.id}`}>
                      <a className="flex-shrink-0 w-6 h-6 mr-1">
                        <img
                          className="w-6 h-6 rounded-full"
                          src={issueData.createdBy.avatar}
                          alt=""
                        />
                      </a>
                    </Link>
                    <Link href={`/users/${issueData.createdBy.id}`}>
                      <a className="font-semibold text-gray-100 transition hover:underline hover:text-white">
                        {msg}
                      </a>
                    </Link>
                  </div>
                );
              },
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
      <div className="relative z-10 flex mt-6 text-gray-300">
        <div className="flex-1 lg:pr-4">
          <IssueDescription
            issueId={issueData.id}
            description={firstComment.message}
            onEdit={(newMessage) => {
              editFirstComment(newMessage);
            }}
            onDelete={() => setShowDeleteModal(true)}
          />
          <div className="mt-8 lg:hidden">
            <div className="media-facts">
              <div className="media-fact">
                <span>{intl.formatMessage(messages.mediatype)}</span>
                <span className="media-fact-value">
                  {intl.formatMessage(
                    mediaType === MediaType.MOVIE
                      ? globalMessages.movie
                      : globalMessages.tvshow
                  )}
                </span>
              </div>
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
            {hasPermission(Permission.MANAGE_ISSUES) && (
              <div className="flex flex-col mt-4 mb-6 space-y-2">
                {issueData?.media.serviceUrl && (
                  <Button
                    as="a"
                    href={issueData?.media.serviceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full"
                    buttonType="ghost"
                  >
                    <ExternalLinkIcon />
                    <span>
                      {intl.formatMessage(
                        issueData.media.mediaType === MediaType.MOVIE
                          ? messages.openinradarr
                          : messages.openinsonarr
                      )}
                    </span>
                  </Button>
                )}
              </div>
            )}
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
                          placeholder="Respond with a comment..."
                          className="h-20"
                        />
                        <div className="flex items-center justify-end mt-4 space-x-2">
                          {hasPermission(Permission.MANAGE_ISSUES) && (
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
                                  <RefreshIcon />
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
                            <ChatIcon />
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
        <div className="hidden lg:block lg:pl-4 lg:w-80">
          <div className="media-facts">
            <div className="media-fact">
              <span>{intl.formatMessage(messages.issuetype)}</span>
              <span className="media-fact-value">
                {intl.formatMessage(
                  issueOption?.name ?? messages.unknownissuetype
                )}
              </span>
            </div>
            <div className="media-fact">
              <span>{intl.formatMessage(messages.mediatype)}</span>
              <span className="media-fact-value">
                {intl.formatMessage(
                  mediaType === MediaType.MOVIE
                    ? globalMessages.movie
                    : globalMessages.tvshow
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
          {hasPermission(Permission.MANAGE_ISSUES) && (
            <div className="flex flex-col mt-4 mb-6 space-y-2">
              {issueData?.media.serviceUrl && (
                <Button
                  as="a"
                  href={issueData?.media.serviceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full"
                  buttonType="ghost"
                >
                  <ExternalLinkIcon />
                  <span>
                    {intl.formatMessage(
                      issueData.media.mediaType === MediaType.MOVIE
                        ? messages.openinradarr
                        : messages.openinsonarr
                    )}
                  </span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueDetails;
