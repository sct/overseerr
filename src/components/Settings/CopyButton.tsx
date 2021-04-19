import { ClipboardCopyIcon } from '@heroicons/react/solid';
import React, { useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useClipboard from 'react-use-clipboard';

const messages = defineMessages({
  copied: 'Copied API key to clipboard.',
});

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
  const intl = useIntl();
  const [isCopied, setCopied] = useClipboard(textToCopy, {
    successDuration: 1000,
  });
  const { addToast } = useToasts();

  useEffect(() => {
    if (isCopied) {
      addToast(intl.formatMessage(messages.copied), {
        appearance: 'info',
        autoDismiss: true,
      });
    }
  }, [isCopied, addToast, intl]);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        setCopied();
      }}
      className="relative inline-flex items-center px-4 py-2 -ml-px text-sm font-medium leading-5 text-white transition duration-150 ease-in-out bg-indigo-600 border border-gray-500 hover:bg-indigo-500 focus:outline-none focus:ring-blue focus:border-blue-300 active:bg-gray-100 active:text-gray-700"
    >
      <ClipboardCopyIcon />
    </button>
  );
};

export default CopyButton;
