import ReDownloadModalContent from '@app/components/ReDownloadModal/ReDownloadModalContent';
import { Transition } from '@headlessui/react';

interface ReDownloadModalProps {
  show?: boolean;
  onCancel: () => void;
  mediaType: 'movie' | 'tv';
  tmdbId: number;
  mediaId: number;
  is4k?: boolean;
}

const ReDownloadModal = ({
  show,
  mediaType,
  onCancel,
  tmdbId,
  mediaId,
  is4k,
}: ReDownloadModalProps) => (
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
    <ReDownloadModalContent
      mediaType={mediaType}
      onCancel={onCancel}
      tmdbId={tmdbId}
      mediaId={mediaId}
      is4k={is4k}
    />
  </Transition>
);

export default ReDownloadModal;
