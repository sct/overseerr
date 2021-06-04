import React from 'react';
import { hasNotificationType, NotificationItem } from '..';

interface NotificationTypeProps {
  option: NotificationItem;
  currentTypes: number;
  parent?: NotificationItem;
  onUpdate: (newTypes: number) => void;
}

const NotificationType: React.FC<NotificationTypeProps> = ({
  option,
  currentTypes,
  onUpdate,
  parent,
}) => {
  return (
    <>
      <div
        className={`relative flex items-start first:mt-0 mt-4 ${
          !!parent?.value && hasNotificationType(parent.value, currentTypes)
            ? 'opacity-50'
            : ''
        }`}
      >
        <div className="flex items-center h-6">
          <input
            id={option.id}
            name="permissions"
            type="checkbox"
            disabled={
              !!parent?.value && hasNotificationType(parent.value, currentTypes)
            }
            onClick={() => {
              onUpdate(
                hasNotificationType(option.value, currentTypes)
                  ? currentTypes - option.value
                  : currentTypes + option.value
              );
            }}
            checked={
              hasNotificationType(option.value, currentTypes) ||
              (!!parent?.value &&
                hasNotificationType(parent.value, currentTypes))
            }
          />
        </div>
        <div className="ml-3 text-sm leading-6">
          <label htmlFor={option.id} className="block font-medium text-white">
            <div className="flex flex-col">
              <span>{option.name}</span>
              <span className="text-gray-500">{option.description}</span>
            </div>
          </label>
        </div>
      </div>
      {(option.children ?? []).map((child) => (
        <div key={`notification-type-child-${child.id}`} className="pl-6 mt-4">
          <NotificationType
            option={child}
            currentTypes={currentTypes}
            onUpdate={(newTypes) => onUpdate(newTypes)}
            parent={option}
          />
        </div>
      ))}
    </>
  );
};

export default NotificationType;
