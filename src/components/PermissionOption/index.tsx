import React from 'react';
import { hasPermission } from '../../../server/lib/permissions';
import { Permission, User } from '../../hooks/useUser';

export interface PermissionItem {
  id: string;
  name: string;
  description: string;
  permission: Permission;
  children?: PermissionItem[];
}

interface PermissionOptionProps {
  option: PermissionItem;
  currentPermission: number;
  user?: User;
  parent?: PermissionItem;
  onUpdate: (newPermissions: number) => void;
}

const PermissionOption: React.FC<PermissionOptionProps> = ({
  option,
  currentPermission,
  onUpdate,
  user,
  parent,
}) => {
  return (
    <>
      <div
        className={`relative flex items-start first:mt-0 mt-4 ${
          (option.permission !== Permission.ADMIN &&
            hasPermission(Permission.ADMIN, currentPermission)) ||
          (!!parent?.permission &&
            hasPermission(parent.permission, currentPermission)) ||
          (user && user.id !== 1 && option.permission === Permission.ADMIN) ||
          (user &&
            !hasPermission(Permission.MANAGE_SETTINGS, user.permissions) &&
            option.permission === Permission.MANAGE_SETTINGS)
            ? 'opacity-50'
            : ''
        }`}
      >
        <div className="flex items-center h-5">
          <input
            id={option.id}
            name="permissions"
            type="checkbox"
            className="w-4 h-4 text-indigo-600 transition duration-150 ease-in-out rounded-md form-checkbox"
            disabled={
              (option.permission !== Permission.ADMIN &&
                hasPermission(Permission.ADMIN, currentPermission)) ||
              (!!parent?.permission &&
                hasPermission(parent.permission, currentPermission)) ||
              (user &&
                user.id !== 1 &&
                option.permission === Permission.ADMIN) ||
              (user &&
                !hasPermission(Permission.MANAGE_SETTINGS, user.permissions) &&
                option.permission === Permission.MANAGE_SETTINGS)
            }
            onChange={() => {
              onUpdate(
                hasPermission(option.permission, currentPermission)
                  ? currentPermission - option.permission
                  : currentPermission + option.permission
              );
            }}
            checked={
              hasPermission(option.permission, currentPermission) ||
              (!!parent?.permission &&
                hasPermission(parent.permission, currentPermission))
            }
          />
        </div>
        <div className="ml-3 text-sm leading-5">
          <label htmlFor={option.id} className="font-medium">
            {option.name}
          </label>
          <p className="text-gray-500">{option.description}</p>
        </div>
      </div>
      {(option.children ?? []).map((child) => (
        <div key={`permission-child-${child.id}`} className="pl-6 mt-4">
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
