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
      className="input-action"
    >
      <ClipboardCopyIcon />
    </button>
  );
};

export default CopyButton;
