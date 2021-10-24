import { Menu } from '@headlessui/react';
import { ExclamationIcon } from '@heroicons/react/outline';
import { DotsVerticalIcon } from '@heroicons/react/solid';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import React, { useState } from 'react';
import { defineMessages, FormattedRelativeTime, useIntl } from 'react-intl';
import ReactMarkdown from 'react-markdown';
import * as Yup from 'yup';
import type { default as IssueCommentType } from '../../../../server/entity/IssueComment';
import { Permission, useUser } from '../../../hooks/useUser';
import Button from '../../Common/Button';
import Modal from '../../Common/Modal';
import Transition from '../../Transition';

const messages = defineMessages({
  postedby: 'Posted by {username} {relativeTime}',
  postedbyedited: 'Posted by {username} {relativeTime} (Edited)',
  delete: 'Delete Comment',
  areyousuredelete: 'Are you sure you want to delete this comment?',
  validationComment: 'You must provide a message',
  edit: 'Edit Comment',
});

interface IssueCommentProps {
  comment: IssueCommentType;
  isReversed?: boolean;
  isActiveUser?: boolean;
  onUpdate?: () => void;
}

const IssueComment: React.FC<IssueCommentProps> = ({
  comment,
  isReversed = false,
  isActiveUser = false,
  onUpdate,
}) => {
  const intl = useIntl();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { user, hasPermission } = useUser();

  const EditCommentSchema = Yup.object().shape({
    newMessage: Yup.string().required(
      intl.formatMessage(messages.validationComment)
    ),
  });

  const deleteComment = async () => {
    try {
      await axios.delete(`/api/v1/issueComment/${comment.id}`);
    } catch (e) {
      // something went wrong deleting the comment
    } finally {
      if (onUpdate) {
        onUpdate();
      }
    }
  };

  const belongsToUser = comment.user.id === user?.id;

  return (
    <div
      className={`flex ${
        isReversed ? 'flex-row' : 'flex-row-reverse space-x-reverse'
      } mt-4 space-x-4`}
    >
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
          title={intl.formatMessage(messages.delete)}
          onCancel={() => setShowDeleteModal(false)}
          onOk={() => deleteComment()}
          okText={intl.formatMessage(messages.delete)}
          okButtonType="danger"
          iconSvg={<ExclamationIcon />}
        >
          {intl.formatMessage(messages.areyousuredelete)}
        </Modal>
      </Transition>
      <img
        src={comment.user.avatar}
        alt=""
        className="w-10 h-10 rounded-full ring-1 ring-gray-500"
      />
      <div className="relative flex-1">
        <div className="w-full rounded-md shadow ring-1 ring-gray-500">
          {(belongsToUser || hasPermission(Permission.MANAGE_ISSUES)) && (
            <Menu
              as="div"
              className="absolute z-40 inline-block text-left top-2 right-1"
            >
              {({ open }) => (
                <>
                  <div>
                    <Menu.Button className="flex items-center text-gray-400 rounded-full hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500">
                      <span className="sr-only">Open options</span>
                      <DotsVerticalIcon
                        className="w-5 h-5"
                        aria-hidden="true"
                      />
                    </Menu.Button>
                  </div>

                  <Transition
                    show={open}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items
                      static
                      className="absolute right-0 w-56 mt-2 origin-top-right bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => setIsEditing(true)}
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                active
                                  ? 'bg-gray-600 text-white'
                                  : 'text-gray-100'
                              }`}
                            >
                              {intl.formatMessage(messages.edit)}
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => setShowDeleteModal(true)}
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                active
                                  ? 'bg-gray-600 text-white'
                                  : 'text-gray-100'
                              }`}
                            >
                              {intl.formatMessage(messages.delete)}
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </>
              )}
            </Menu>
          )}
          <div
            className={`absolute w-3 h-3 transform rotate-45 bg-gray-800 shadow top-3 z-10 ring-1 ring-gray-500 ${
              isReversed ? '-left-1' : '-right-1'
            }`}
          />
          <div className="relative z-20 w-full py-4 pl-4 pr-8 bg-gray-800 rounded-md">
            {isEditing ? (
              <Formik
                initialValues={{ newMessage: comment.message }}
                onSubmit={async (values) => {
                  await axios.put(`/api/v1/issueComment/${comment.id}`, {
                    message: values.newMessage,
                  });

                  if (onUpdate) {
                    onUpdate();
                  }

                  setIsEditing(false);
                }}
                validationSchema={EditCommentSchema}
              >
                {({ isValid, isSubmitting, errors, touched }) => {
                  return (
                    <Form>
                      <Field
                        as="textarea"
                        id="newMessage"
                        name="newMessage"
                        className="h-24"
                      />
                      {errors.newMessage && touched.newMessage && (
                        <div className="error">{errors.newMessage}</div>
                      )}
                      <div className="flex items-center justify-end mt-4 space-x-2">
                        <Button
                          type="button"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          buttonType="primary"
                          disabled={!isValid || isSubmitting}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </Form>
                  );
                }}
              </Formik>
            ) : (
              <div className="w-full max-w-full prose">
                <ReactMarkdown skipHtml allowedElements={['p', 'em', 'strong']}>
                  {comment.message}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
        <div
          className={`flex justify-between items-center text-xs pt-2 px-2 ${
            isReversed ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          <span>
            {intl.formatMessage(
              comment.createdAt !== comment.updatedAt
                ? messages.postedbyedited
                : messages.postedby,
              {
                username: (
                  <a
                    href={
                      isActiveUser ? '/profile' : `/users/${comment.user.id}`
                    }
                    className="font-semibold text-gray-100 transition duration-300 hover:underline hover:text-white"
                  >
                    {comment.user.displayName}
                  </a>
                ),
                relativeTime: (
                  <FormattedRelativeTime
                    value={Math.floor(
                      (new Date(comment.createdAt).getTime() - Date.now()) /
                        1000
                    )}
                    updateIntervalInSeconds={1}
                    numeric="auto"
                  />
                ),
              }
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default IssueComment;
