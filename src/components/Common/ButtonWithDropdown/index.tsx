import React, {
  useState,
  useRef,
  AnchorHTMLAttributes,
  ReactNode,
  ButtonHTMLAttributes,
} from 'react';
import useClickOutside from '../../../hooks/useClickOutside';
import Transition from '../../Transition';
import { withProperties } from '../../../utils/typeHelpers';

const DropdownItem: React.FC<AnchorHTMLAttributes<HTMLAnchorElement>> = ({
  children,
  ...props
}) => (
  <a
    className="cursor-pointer flex items-center px-4 py-2 text-sm leading-5 text-white bg-indigo-600 hover:bg-indigo-500 hover:text-white focus:outline-none focus:border-indigo-700 focus:text-white"
    {...props}
  >
    {children}
  </a>
);

interface ButtonWithDropdownProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: ReactNode;
  dropdownIcon?: ReactNode;
}

const ButtonWithDropdown: React.FC<ButtonWithDropdownProps> = ({
  text,
  children,
  dropdownIcon,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLSpanElement>(null);
  useClickOutside(buttonRef, () => setIsOpen(false));

  return (
    <span
      className="relative z-0 inline-flex shadow-sm rounded-md"
      ref={buttonRef}
    >
      <button
        type="button"
        className={`relative inline-flex items-center px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-500 text-sm leading-5 font-medium hover:text-white focus:shadow-outline-indigo active:bg-indigo-700 focus:z-10 focus:outline-none focus:shadow-outline-blue transition ease-in-out duration-150 ${
          children ? 'rounded-l-md' : 'rounded-md'
        }`}
        {...props}
      >
        {text}
      </button>
      <span className="-ml-px relative block">
        {children && (
          <button
            type="button"
            className="relative inline-flex items-center px-2 py-2 rounded-r-md bg-indigo-700 hover:bg-indigo-500 text-sm leading-5 font-medium text-white focus:z-10 focus:outline-none active:bg-indigo-700 border border-indigo-600 focus:shadow-outline-blue transition ease-in-out duration-150"
            aria-label="Expand"
            onClick={() => setIsOpen((state) => !state)}
          >
            {dropdownIcon ? (
              dropdownIcon
            ) : (
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        )}
        <Transition
          show={isOpen}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <div className="origin-top-right absolute right-0 mt-2 -mr-1 w-56 rounded-md shadow-lg">
            <div className="rounded-md bg-indigo-600 shadow-xs">
              <div className="py-1">{children}</div>
            </div>
          </div>
        </Transition>
      </span>
    </span>
  );
};
export default withProperties(ButtonWithDropdown, { Item: DropdownItem });
