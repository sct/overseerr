import React, { useEffect, useState } from 'react';
import PermissionEdit from '../PermissionEdit';
import Modal from '../Common/Modal';
import { User, useUser } from '../../hooks/useUser';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import axios from 'axios';
import { useToasts } from 'react-toast-notifications';
import { messages as userEditMessages } from '../UserEdit';

interface BulkEditProps {
  selectedUserIds: number[];
  users?: User[];
  onCancel?: () => void;
  onComplete?: (updatedUsers: User[]) => void;
  onSaving?: (isSaving: boolean) => void;
}

const messages = defineMessages({
  userssaved: 'Users saved',
});

const BulkEditModal: React.FC<BulkEditProps> = ({
  selectedUserIds,
  users,
  onCancel,
  onComplete,
  onSaving,
}) => {
  const { user: currentUser } = useUser();
  const intl = useIntl();
  const { addToast } = useToasts();
  const [currentPermission, setCurrentPermission] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (onSaving) {
      onSaving(isSaving);
    }
  }, [isSaving, onSaving]);

  const updateUsers = async () => {
    try {
      setIsSaving(true);
      const { data: updated } = await axios.put<User[]>(`/api/v1/user`, {
        ids: selectedUserIds,
        permissions: currentPermission,
      });
      if (onComplete) {
        onComplete(updated);
      }
      addToast(intl.formatMessage(messages.userssaved), {
        appearance: 'success',
        autoDismiss: true,
      });
    } catch (e) {
      addToast(intl.formatMessage(userEditMessages.userfail), {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (users) {
      const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));
      const { permissions: allPermissionsEqual } = selectedUsers.reduce(
        ({ permissions: aPerms }, { permissions: bPerms }) => {
          return {
            permissions: aPerms === bPerms ? aPerms : NaN,
          };
        },
        { permissions: selectedUsers[0].permissions }
      );
      if (allPermissionsEqual) {
        setCurrentPermission(allPermissionsEqual);
      }
    }
  }, [users, selectedUserIds]);

  return (
    <Modal
      title={intl.formatMessage(userEditMessages.edituser)}
      onOk={() => {
        updateUsers();
      }}
      okDisabled={isSaving}
      okText={intl.formatMessage(userEditMessages.save)}
      onCancel={onCancel}
    >
      <div className="mt-8">
        <div role="group" aria-labelledby="label-permissions">
          <div className="sm:grid sm:grid-cols-4 sm:gap-4">
            <div>
              <div
                className="text-base font-medium leading-6 text-gray-400 sm:text-sm sm:leading-5"
                id="label-permissions"
              >
                <FormattedMessage {...userEditMessages.permissions} />
              </div>
            </div>
            <div className="mt-4 sm:mt-0 sm:col-span-2">
              <div className="max-w-lg">
                <PermissionEdit
                  user={currentUser}
                  currentPermission={currentPermission}
                  onUpdate={(newPermission) =>
                    setCurrentPermission(newPermission)
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BulkEditModal;
