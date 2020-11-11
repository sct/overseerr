import React, { useState, useRef } from 'react';
import Transition from '../../Transition';
import { useUser } from '../../../hooks/useUser';
import axios from 'axios';
import useClickOutside from '../../../hooks/useClickOutside';

const UserDropdown: React.FC = () => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, revalidate } = useUser();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  useClickOutside(dropdownRef, () => setDropdownOpen(false));

  const logout = async () => {
    const response = await axios.get('/api/v1/auth/logout');

    if (response.data?.status === 'ok') {
      revalidate();
    }
  };

  return (
    <div className="ml-3 relative">
      <div>
        <button
          className="max-w-xs flex items-center text-sm rounded-full focus:outline-none focus:shadow-outline"
          id="user-menu"
          aria-label="User menu"
          aria-haspopup="true"
          onClick={() => setDropdownOpen(true)}
        >
          <img className="h-8 w-8 rounded-full" src={user?.avatar} alt="" />
        </button>
      </div>
      <Transition
        show={isDropdownOpen}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div
          className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg"
          ref={dropdownRef}
        >
          <div
            className="py-1 rounded-md bg-cool-gray-700 shadow-xs"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu"
          >
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 transition ease-in-out duration-150"
              role="menuitem"
              onClick={() => logout()}
            >
              Sign out
            </a>
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default UserDropdown;
