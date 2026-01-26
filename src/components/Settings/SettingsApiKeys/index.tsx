import Button from '@app/components/Common/Button';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import Modal from '@app/components/Common/Modal';
import PageTitle from '@app/components/Common/PageTitle';
import Table from '@app/components/Common/Table';
import { PermissionEdit } from '@app/components/PermissionEdit';
import globalMessages from '@app/i18n/globalMessages';
import { Transition } from '@headlessui/react';
import type {
  ApiKeyCreateResponse,
  ApiKeyResponse,
} from '@server/interfaces/api/apiKeyInterfaces';
import axios from 'axios';
import copy from 'copy-to-clipboard';
import { Fragment, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';

const messages = defineMessages({
  apiKeys: 'API Keys',
  apiKeysDescription:
    'Create scoped API keys for external access. The secret is only shown once at creation time.',
  name: 'Name',
  key: 'Key',
  permissions: 'Permissions',
  status: 'Status',
  created: 'Created',
  lastUsed: 'Last Used',
  actions: 'Actions',
  create: 'Create API Key',
  createdTitle: 'API Key Created',
  copyKey: 'Copy Key',
  copied: 'Copied API key to clipboard.',
  active: 'Active',
  inactive: 'Inactive',
  deactivate: 'Deactivate',
  activate: 'Activate',
  delete: 'Delete',
  confirmDelete: 'Confirm Delete',
  toastCreateFailed: 'Something went wrong while creating the API key.',
  toastUpdateFailed: 'Something went wrong while updating the API key.',
  toastDeleteFailed: 'Something went wrong while deleting the API key.',
});

const SettingsApiKeys = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { data, error, mutate } = useSWR<ApiKeyResponse[]>(
    '/api/v1/settings/api-keys'
  );

  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState(0);
  const [createdKey, setCreatedKey] = useState<ApiKeyCreateResponse | null>(
    null
  );

  const createKey = async () => {
    try {
      const response = await axios.post<ApiKeyCreateResponse>(
        '/api/v1/settings/api-keys',
        {
          name: newKeyName,
          permissions: newKeyPermissions,
        }
      );

      setCreatedKey(response.data);
      setNewKeyName('');
      setNewKeyPermissions(0);
      mutate();
    } catch (_e) {
      addToast(intl.formatMessage(messages.toastCreateFailed), {
        autoDismiss: true,
        appearance: 'error',
      });
    }
  };

  const toggleActive = async (key: ApiKeyResponse) => {
    try {
      await axios.put(`/api/v1/settings/api-keys/${key.id}`, {
        isActive: !key.isActive,
      });
      mutate();
    } catch (_e) {
      addToast(intl.formatMessage(messages.toastUpdateFailed), {
        autoDismiss: true,
        appearance: 'error',
      });
    }
  };

  const deleteKey = async (key: ApiKeyResponse) => {
    try {
      await axios.delete(`/api/v1/settings/api-keys/${key.id}`);
      mutate();
    } catch (_e) {
      addToast(intl.formatMessage(messages.toastDeleteFailed), {
        autoDismiss: true,
        appearance: 'error',
      });
    }
  };

  const copyCreatedKey = () => {
    if (!createdKey) return;
    copy(createdKey.apiKey);
    addToast(intl.formatMessage(messages.copied), {
      autoDismiss: true,
      appearance: 'success',
    });
  };

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.apiKeys),
          intl.formatMessage(globalMessages.settings),
        ]}
      />

      <Transition
        as={Fragment}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        appear
        show={!!createdKey}
      >
        <Modal
          title={intl.formatMessage(messages.createdTitle)}
          onCancel={() => setCreatedKey(null)}
          cancelText={intl.formatMessage(globalMessages.close)}
          onOk={copyCreatedKey}
          okText={intl.formatMessage(messages.copyKey)}
          okButtonType="primary"
        >
          {createdKey && (
            <div className="space-y-3">
              <div className="text-sm text-gray-300">
                {createdKey.name} • ****{createdKey.last4}
              </div>
              <pre className="break-all rounded-md bg-gray-900 p-3 text-sm text-gray-200">
                {createdKey.apiKey}
              </pre>
              <div className="text-xs text-gray-400">
                {intl.formatMessage(messages.apiKeysDescription)}
              </div>
            </div>
          )}
        </Modal>
      </Transition>

      <div className="mb-6">
        <h3 className="heading">{intl.formatMessage(messages.apiKeys)}</h3>
        <p className="description">
          {intl.formatMessage(messages.apiKeysDescription)}
        </p>
      </div>

      <div className="section">
        <div className="form-row">
          <label htmlFor="apiKeyName" className="text-label">
            {intl.formatMessage(messages.name)}
          </label>
          <div className="form-input-area">
            <div className="form-input-field">
              <input
                id="apiKeyName"
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder={intl.formatMessage(messages.name)}
              />
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="text-label">{intl.formatMessage(messages.permissions)}</div>
          <div className="form-input-area">
            <PermissionEdit
              actingUser={undefined}
              currentUser={undefined}
              currentPermission={newKeyPermissions}
              onUpdate={(newPermissions) => setNewKeyPermissions(newPermissions)}
            />
          </div>
        </div>

        <div className="actions">
          <div className="flex justify-end">
            <Button
              buttonType="primary"
              disabled={!newKeyName.trim()}
              onClick={() => createKey()}
            >
              {intl.formatMessage(messages.create)}
            </Button>
          </div>
        </div>
      </div>

      <Table>
        <thead>
          <tr>
            <Table.TH>{intl.formatMessage(messages.name)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.key)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.permissions)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.status)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.created)}</Table.TH>
            <Table.TH>{intl.formatMessage(messages.lastUsed)}</Table.TH>
            <Table.TH className="text-right">
              {intl.formatMessage(messages.actions)}
            </Table.TH>
          </tr>
        </thead>
        <Table.TBody>
          {(data ?? []).map((key) => (
            <tr key={`api-key-${key.id}`}>
              <Table.TD className="truncate">{key.name}</Table.TD>
              <Table.TD className="font-mono text-gray-300">
                ****{key.last4}
              </Table.TD>
              <Table.TD className="text-gray-300">{key.permissions}</Table.TD>
              <Table.TD className="text-gray-300">
                {key.isActive
                  ? intl.formatMessage(messages.active)
                  : intl.formatMessage(messages.inactive)}
              </Table.TD>
              <Table.TD className="text-gray-300 whitespace-nowrap">
                {intl.formatDate(key.createdAt, {
                  year: 'numeric',
                  month: 'short',
                  day: '2-digit',
                })}
              </Table.TD>
              <Table.TD className="text-gray-300 whitespace-nowrap">
                {key.lastUsedAt
                  ? intl.formatDate(key.lastUsedAt, {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                      hour: 'numeric',
                      minute: 'numeric',
                    })
                  : '—'}
              </Table.TD>
              <Table.TD alignText="right">
                <div className="flex justify-end gap-2">
                  <Button onClick={() => toggleActive(key)}>
                    {key.isActive
                      ? intl.formatMessage(messages.deactivate)
                      : intl.formatMessage(messages.activate)}
                  </Button>
                  <ConfirmButton
                    onClick={() => deleteKey(key)}
                    confirmText={intl.formatMessage(messages.confirmDelete)}
                  >
                    {intl.formatMessage(messages.delete)}
                  </ConfirmButton>
                </div>
              </Table.TD>
            </tr>
          ))}
        </Table.TBody>
      </Table>
    </>
  );
};

export default SettingsApiKeys;

