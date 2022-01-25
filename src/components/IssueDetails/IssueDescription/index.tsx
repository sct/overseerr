import { Menu, Transition } from '@headlessui/react';
import { DotsVerticalIcon } from '@heroicons/react/solid';
import { Field, Form, Formik } from 'formik';
import React, { Fragment, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import ReactMarkdown from 'react-markdown';
import { Permission, useUser } from '../../../hooks/useUser';
import globalMessages from '../../../i18n/globalMessages';
import Button from '../../Common/Button';

const messages = defineMessages({
  description: 'Description',
  edit: 'Edit Description',
  deleteissue: 'Delete Issue',
});

interface IssueDescriptionProps {
  description: string;
  belongsToUser: boolean;
  commentCount: number;
  onEdit: (newDescription: string) => void;
  onDelete: () => void;
}

const IssueDescription: React.FC<IssueDescriptionProps> = ({
  description,
  belongsToUser,
  commentCount,
  onEdit,
  onDelete,
}) => {
  const intl = useIntl();
  const { hasPermission } = useUser();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-100 lg:text-xl">
          {intl.formatMessage(messages.description)}
        </div>
        {(hasPermission(Permission.MANAGE_ISSUES) || belongsToUser) && (
          <Menu as="div" className="relative inline-block text-left">
            {({ open }) => (
              <>
                <div>
                  <Menu.Button className="flex items-center rounded-full text-gray-400 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100">
                    <span className="sr-only">Open options</span>
                    <DotsVerticalIcon className="h-5 w-5" aria-hidden="true" />
                  </Menu.Button>
                </div>

                <Transition
                  show={open}
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items
                    static
                    className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                  >
                    <div className="py-1">
                      {belongsToUser && (
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => setIsEditing(true)}
                              className={`block w-full px-4 py-2 text-left text-sm ${
                                active
                                  ? 'bg-gray-600 text-white'
                                  : 'text-gray-100'
                              }`}
                            >
                              {intl.formatMessage(messages.edit)}
                            </button>
                          )}
                        </Menu.Item>
                      )}
                      {(hasPermission(Permission.MANAGE_ISSUES) ||
                        !commentCount) && (
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => onDelete()}
                              className={`block w-full px-4 py-2 text-left text-sm ${
                                active
                                  ? 'bg-gray-600 text-white'
                                  : 'text-gray-100'
                              }`}
                            >
                              {intl.formatMessage(messages.deleteissue)}
                            </button>
                          )}
                        </Menu.Item>
                      )}
                    </div>
                  </Menu.Items>
                </Transition>
              </>
            )}
          </Menu>
        )}
      </div>
      {isEditing ? (
        <Formik
          initialValues={{ newMessage: description }}
          onSubmit={(values) => {
            onEdit(values.newMessage);
            setIsEditing(false);
          }}
        >
          {() => {
            return (
              <Form className="mt-4">
                <Field
                  id="newMessage"
                  name="newMessage"
                  as="textarea"
                  className="h-40"
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    buttonType="default"
                    className="mr-2"
                    type="button"
                    onClick={() => setIsEditing(false)}
                  >
                    <span>{intl.formatMessage(globalMessages.cancel)}</span>
                  </Button>
                  <Button buttonType="primary">
                    <span>{intl.formatMessage(globalMessages.save)}</span>
                  </Button>
                </div>
              </Form>
            );
          }}
        </Formik>
      ) : (
        <div className="prose mt-4">
          <ReactMarkdown
            allowedElements={['p', 'img', 'strong', 'em']}
            skipHtml
          >
            {description}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default IssueDescription;
