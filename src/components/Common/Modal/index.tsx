import Button from '@app/components/Common/Button';
import { useFocusTrap, useModalKeyboard } from '@app/hooks/useFocusTrap';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { Fragment, useRef } from 'react';

interface ModalProps {
  show?: boolean;
  onClose?: () => void;
  title?: string;
  subText?: React.ReactNode;
  onOk?: () => void;
  okText?: React.ReactNode;
  okDisabled?: boolean;
  okType?: 'primary' | 'danger' | 'warning' | 'success' | 'ghost';
  okButtonSize?: 'sm' | 'md' | 'lg';
  onSecondary?: () => void;
  secondaryText?: React.ReactNode;
  secondaryDisabled?: boolean;
  onTertiary?: () => void;
  tertiaryText?: React.ReactNode;
  tertiaryDisabled?: boolean;
  children?: React.ReactNode;
  description?: React.ReactNode;
  iconSvg?: React.ReactNode;
  backgroundClickable?: boolean;
  scroll?: boolean;
  className?: string;
  dialogClassName?: string;
  isDangerousAction?: boolean;
}

const Modal = ({
  show,
  onClose,
  title,
  subText,
  onOk,
  okText,
  okDisabled,
  okType = 'primary',
  okButtonSize = 'md',
  onSecondary,
  secondaryText,
  secondaryDisabled,
  onTertiary,
  tertiaryText,
  tertiaryDisabled,
  children,
  description,
  iconSvg,
  backgroundClickable = true,
  // escapeToClose - Headless UI Dialog handles Escape by default
  scroll = false,
  className,
  dialogClassName,
  isDangerousAction = false,
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Implement focus trapping for accessibility
  useFocusTrap(modalRef, !!show);

  // Implement keyboard navigation (Escape key handling)
  useModalKeyboard(onClose, !!show);

  return (
    <Transition appear show={show ?? false} as={Fragment}>
      <Dialog
        as="div"
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          className || ''
        }`}
        onClose={() => {
          if (backgroundClickable) {
            onClose?.();
          }
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div
          ref={modalRef}
          className="fixed inset-0 flex items-center justify-center p-4"
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel
              className={`w-full transform overflow-hidden text-left align-middle transition-all sm:max-w-prose md:max-w-prose lg:max-w-prose ${
                dialogClassName || ''
              }`}
              as="div"
            >
              <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-6 py-4">
                <div className="flex items-center space-x-3">
                  {iconSvg}
                  <div>
                    {title && (
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-white"
                      >
                        {title}
                      </Dialog.Title>
                    )}
                    {subText && (
                      <p className="mt-1 text-sm text-gray-400">{subText}</p>
                    )}
                  </div>
                </div>
                {onClose && (
                  <button
                    type="button"
                    className="rounded-md p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onClick={onClose}
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                )}
              </div>

              {description && (
                <div className="border-b border-gray-700 bg-gray-800 px-6 py-4">
                  {description}
                </div>
              )}

              <div className={`${scroll ? 'py-6' : ''}`}>
                {scroll ? (
                  <div className="relative max-h-96 overflow-y-auto">
                    <div className="bg-gray-800 px-6 text-white">
                      {children}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800 px-6 text-white">{children}</div>
                )}
              </div>

              {(onOk || onSecondary || onTertiary) && (
                <div className="flex justify-end space-x-3 bg-gray-700 px-6 py-4">
                  {onSecondary && (
                    <Button
                      buttonType={isDangerousAction ? 'ghost' : 'default'}
                      disabled={secondaryDisabled}
                      onClick={onSecondary}
                      className={`px-6 ${
                        isDangerousAction ? 'cursor-not-allowed' : ''
                      }`}
                    >
                      {secondaryText || 'Cancel'}
                    </Button>
                  )}
                  {onTertiary && (
                    <Button
                      buttonType="ghost"
                      disabled={tertiaryDisabled}
                      onClick={onTertiary}
                      className="px-6"
                    >
                      {tertiaryText}
                    </Button>
                  )}
                  {onOk && (
                    <Button
                      buttonType={okType}
                      disabled={okDisabled}
                      onClick={onOk}
                      buttonSize={okButtonSize}
                      className="px-6"
                    >
                      {okText || 'Confirm'}
                    </Button>
                  )}
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
