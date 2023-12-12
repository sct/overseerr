import { Transition } from '@headlessui/react';
import { useState } from 'react';
import Modal from '@app/components/Common/Modal';
import useSWR from 'swr';
import type { MovieDetails } from '@server/models/Movie';
import { useIntl } from 'react-intl';
import globalMessages from '@app/i18n/globalMessages';

interface DeclineRequestModalProps {
  show: boolean;
  tmdbId: number;
  onDecline?: (declineMessage: string) => void;
  onCancel?: () => void;
}

const DeclineRequestModal = ({
  show,
  tmdbId,
  onDecline,
  onCancel,
}: DeclineRequestModalProps) => {
  const intl = useIntl();
  const [declineMessage, setDeclineMessage] = useState('');
  const { data, error } = useSWR<MovieDetails>(`/api/v1/movie/${tmdbId}`, {
    revalidateOnMount: true,
  });

  const handleDecline = () => {
    if (onDecline) {
      onDecline(declineMessage);
    }
  };

  return (
    <Transition
      as="div"
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      show={show}
    >
      <Modal
        loading={!data && !error}
        title="Decline Request"
        subTitle={data?.title}
        onCancel={onCancel}
        onOk={handleDecline}
        okText={intl.formatMessage(globalMessages.decline)}
        okButtonType="danger"
        cancelText={intl.formatMessage(globalMessages.cancel)}
        backdrop={`https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/${data?.backdropPath}`}
        >
        <textarea
          value={declineMessage}
          onChange={(e) => setDeclineMessage(e.target.value)}
          placeholder="Optional decline message"
        />
      </Modal>
    </Transition>
  );
};

export default DeclineRequestModal;
