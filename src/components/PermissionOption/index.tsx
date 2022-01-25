import React from 'react';
import { hasPermission } from '../../../server/lib/permissions';
import useSettings from '../../hooks/useSettings';
import { Permission, User } from '../../hooks/useUser';

export interface PermissionItem {
  id: string;
  name: string;
  description: string;
  permission: Permission;
  children?: PermissionItem[];
  requires?: PermissionRequirement[];
}

interface PermissionRequirement {
  permissions: Permission[];
  type?: 'and' | 'or';
}

interface PermissionOptionProps {
  option: PermissionItem;
  actingUser?: User;
  currentUser?: User;
  currentPermission: number;
  parent?: PermissionItem;
  onUpdate: (newPermissions: number) => void;
}

const PermissionOption: React.FC<PermissionOptionProps> = ({
  option,
  actingUser,
  currentUser,
  currentPermission,
  onUpdate,
  parent,
}) => {
  const settings = useSettings();

  const autoApprovePermissions = [
    Permission.AUTO_APPROVE,
    Permission.AUTO_APPROVE_MOVIE,
    Permission.AUTO_APPROVE_TV,
    Permission.AUTO_APPROVE_4K,
    Permission.AUTO_APPROVE_4K_MOVIE,
    Permission.AUTO_APPROVE_4K_TV,
  ];

  let disabled = false;
  let checked = hasPermission(option.permission, currentPermission);

  if (
    // Permissions for user ID 1 (Plex server owner) cannot be changed
    (currentUser && currentUser.id === 1) ||
    // Admin permission automatically bypasses/grants all other permissions
    (option.permission !== Permission.ADMIN &&
      hasPermission(Permission.ADMIN, currentPermission)) ||
    // Manage Requests permission automatically grants all Auto-Approve permissions
    (autoApprovePermissions.includes(option.permission) &&
      hasPermission(Permission.MANAGE_REQUESTS, currentPermission)) ||
    // Selecting a parent permission automatically selects all children
    (!!parent?.permission &&
      hasPermission(parent.permission, currentPermission))
  ) {
    disabled = true;
    checked = true;
  }

  if (
    // Non-Admin users cannot modify the Admin permission
    (actingUser &&
      !hasPermission(Permission.ADMIN, actingUser.permissions) &&
      option.permission === Permission.ADMIN) ||
    // Users without the Manage Settings permission cannot modify/grant that permission
    (actingUser &&
      !hasPermission(Permission.MANAGE_SETTINGS, actingUser.permissions) &&
      option.permission === Permission.MANAGE_SETTINGS)
  ) {
    disabled = true;
  }

  if (
    // Some permissions are dependent on others; check requirements are fulfilled
    (option.requires &&
      !option.requires.every((requirement) =>
        hasPermission(requirement.permissions, currentPermission, {
          type: requirement.type ?? 'and',
        })
      )) ||
    // Request 4K and Auto-Approve 4K require both 4K movie & 4K series requests to be enabled
    ((option.permission === Permission.REQUEST_4K ||
      option.permission === Permission.AUTO_APPROVE_4K) &&
      (!settings.currentSettings.movie4kEnabled ||
        !settings.currentSettings.series4kEnabled)) ||
    // Request 4K Movie and Auto-Approve 4K Movie require 4K movie requests to be enabled
    ((option.permission === Permission.REQUEST_4K_MOVIE ||
      option.permission === Permission.AUTO_APPROVE_4K_MOVIE) &&
      !settings.currentSettings.movie4kEnabled) ||
    // Request 4K Series and Auto-Approve 4K Series require 4K series requests to be enabled
    ((option.permission === Permission.REQUEST_4K_TV ||
      option.permission === Permission.AUTO_APPROVE_4K_TV) &&
      !settings.currentSettings.series4kEnabled)
  ) {
    disabled = true;
    checked = false;
  }

  return (
    <>
      <div
        className={`relative mt-4 flex items-start first:mt-0 ${
          disabled ? 'opacity-50' : ''
        }`}
      >
        <div className="flex h-6 items-center">
          <input
            id={option.id}
            name="permissions"
            type="checkbox"
            disabled={disabled}
            onChange={() => {
              onUpdate(
                hasPermission(option.permission, currentPermission)
                  ? currentPermission - option.permission
                  : currentPermission + option.permission
              );
            }}
            checked={checked}
          />
        </div>
        <div className="ml-3 text-sm leading-6">
          <label htmlFor={option.id} className="block">
            <div className="flex flex-col">
              <span className="font-medium text-white">{option.name}</span>
              <span className="font-normal text-gray-400">
                {option.description}
              </span>
            </div>
          </label>
        </div>
      </div>
      {(option.children ?? []).map((child) => (
        <div key={`permission-child-${child.id}`} className="mt-4 pl-10">
          <PermissionOption
            option={child}
            currentPermission={currentPermission}
            onUpdate={(newPermission) => onUpdate(newPermission)}
            parent={option}
          />
        </div>
      ))}
    </>
  );
};

export default PermissionOption;
