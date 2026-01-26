import Modal from '@app/components/Common/Modal';
import globalMessages from '@app/i18n/globalMessages';
import { Transition } from '@headlessui/react';
import { CommandLineIcon } from '@heroicons/react/24/outline';
import { Fragment, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  keyboardShortcuts: 'Keyboard Shortcuts',
  shortcutsDescription: 'Quick actions you can perform using keyboard shortcuts',
  approveSelected: 'Approve Selected Requests',
  declineSelected: 'Decline Selected Requests',
  deleteSelected: 'Delete Selected Requests',
  focusSearch: 'Focus Search',
  close: 'Close',
});

interface KeyboardShortcutsProps {
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

const KeyboardShortcuts = ({ shortcuts }: KeyboardShortcutsProps) => {
  const intl = useIntl();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-gray-800 px-4 py-2 text-sm text-gray-300 shadow-lg ring-1 ring-gray-700 transition-colors hover:bg-gray-700 hover:text-white"
        title={intl.formatMessage(messages.keyboardShortcuts)}
      >
        <CommandLineIcon className="h-5 w-5" />
        <span className="hidden sm:inline">?</span>
      </button>

      <Transition
        as={Fragment}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        appear
        show={isOpen}
      >
        <Modal
          title={intl.formatMessage(messages.keyboardShortcuts)}
          onCancel={() => setIsOpen(false)}
          cancelText={intl.formatMessage(globalMessages.close)}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              {intl.formatMessage(messages.shortcutsDescription)}
            </p>
            <div className="space-y-3">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-gray-700 pb-3"
                >
                  <span className="text-sm text-gray-300">
                    {shortcut.description}
                  </span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <kbd
                        key={keyIndex}
                        className="rounded bg-gray-700 px-2 py-1 text-xs font-mono text-gray-200"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      </Transition>
    </>
  );
};

export default KeyboardShortcuts;
