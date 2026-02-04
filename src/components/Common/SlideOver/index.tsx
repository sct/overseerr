import Button from '@app/components/Common/Button';
import { useFocusTrap, useModalKeyboard } from '@app/hooks/useFocusTrap';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Fragment, useRef } from 'react';

interface SlideOverProps {
  show?: boolean;
  onClose?: () => void;
  title?: string;
  subText?: React.ReactNode;
  onSave?: () => void;
  saveText?: React.ReactNode;
  saveProcessing?: boolean;
  saveDisabled?: boolean;
  children?: React.ReactNode;
  actionButtons?: React.ReactNode;
}

const SlideOver = ({
  show,
  onClose,
  title,
  subText,
  onSave,
  saveText,
  saveProcessing,
  saveDisabled,
  children,
  actionButtons,
}: SlideOverProps) => {
  const slideOverRef = useRef<HTMLDivElement>(null);

  // Implement focus trapping for accessibility
  useFocusTrap(slideOverRef, !!show);

  // Implement keyboard navigation (Escape key handling)
  useModalKeyboard(onClose, !!show);

  return (
    <Transition appear show={show ?? false} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-hidden"
        onClose={() => onClose?.()}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="absolute inset-0 bg-gray-900 bg-opacity-75 transition-opacity" />
          </Transition.Child>
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className="pointer-events-auto w-screen max-w-md">
                <div
                  ref={slideOverRef}
                  className="flex h-full flex-col bg-gray-700 shadow-xl"
                >
                  <div className="flex items-start justify-between bg-gray-800 px-6 py-4">
                    <div>
                      {title && (
                        <Dialog.Title className="text-lg font-medium text-white">
                          {title}
                        </Dialog.Title>
                      )}
                      {subText && <div className="mt-1">{subText}</div>}
                    </div>
                    {onClose && (
                      <div className="ml-3 flex h-7 items-center">
                        <button
                          type="button"
                          className="rounded-md bg-gray-800 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          onClick={onClose}
                          aria-label="Close slideover"
                        >
                          <span className="sr-only">Close panel</span>
                          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative flex-1 overflow-y-auto overflow-x-hidden px-6 py-6">
                    {children}
                  </div>

                  {(onSave || actionButtons) && (
                    <div className="flex flex-col space-y-3 bg-gray-800 px-6 py-4">
                      {actionButtons}
                      {onSave && (
                        <Button
                          buttonType="primary"
                          disabled={saveDisabled}
                          onClick={onSave}
                          className="w-full"
                        >
                          {saveProcessing
                            ? 'Processing...'
                            : saveText || 'Save'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default SlideOver;
