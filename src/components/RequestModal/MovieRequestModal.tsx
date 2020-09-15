import React from 'react';
import Modal from '../Common/Modal';
import { useUser } from '../../hooks/useUser';
import { Permission } from '../../../server/lib/permissions';

interface RequestModalProps {
  type: 'request' | 'cancel';
  visible?: boolean;
  onCancel: () => void;
  onOk: () => void;
  title: string;
}

const MovieRequestModal: React.FC<RequestModalProps> = ({
  type,
  visible,
  onCancel,
  onOk,
  title,
}) => {
  const { hasPermission } = useUser();

  let text = hasPermission(Permission.MANAGE_REQUESTS)
    ? 'Your request will be immediately approved. Do you wish to continue?'
    : undefined;

  if (type === 'cancel') {
    text = 'This will remove your request. Are you sure you want to continue?';
  }

  return (
    <Modal
      visible={visible}
      backgroundClickable
      onCancel={onCancel}
      onOk={onOk}
      title={type === 'request' ? `Request ${title}` : 'Cancel Request'}
      okText={type === 'request' ? 'Request' : 'Cancel Request'}
      okButtonType={type === 'cancel' ? 'danger' : 'primary'}
      iconSvg={
        type === 'request' ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        )
      }
    >
      {text}
    </Modal>
  );
};

export default MovieRequestModal;
