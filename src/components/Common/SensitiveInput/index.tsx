import { EyeIcon, EyeOffIcon } from '@heroicons/react/solid';
import { Field } from 'formik';
import React, { useState } from 'react';

interface CustomInputProps extends React.ComponentProps<'input'> {
  as?: 'input';
  isLastButton?: boolean;
}

interface CustomFieldProps extends React.ComponentProps<typeof Field> {
  as?: 'field';
  isLastButton?: boolean;
}

type SensitiveInputProps = CustomInputProps | CustomFieldProps;

const SensitiveInput: React.FC<SensitiveInputProps> = ({
  isLastButton = true,
  as = 'input',
  ...props
}) => {
  const [isHidden, setHidden] = useState(true);
  const Component = as === 'input' ? 'input' : Field;
  const componentProps =
    as === 'input'
      ? props
      : {
          ...props,
          as: props.type === 'textarea' && !isHidden ? 'textarea' : undefined,
        };
  return (
    <>
      <Component
        {...componentProps}
        type={
          isHidden
            ? 'password'
            : props.type !== 'password'
            ? props.type
            : 'text'
        }
        style={{ borderTopRightRadius: '0px', borderBottomRightRadius: '0px' }}
      />
      <button
        onClick={(e) => {
          e.preventDefault();
          setHidden(!isHidden);
        }}
        className={`relative inline-flex items-center px-4 py-2 -ml-px text-sm font-medium leading-5 text-white transition duration-150 ease-in-out bg-indigo-600 border border-gray-500 hover:bg-indigo-500 focus:outline-none focus:ring-blue focus:border-blue-300 active:bg-gray-100 active:text-gray-700 ${
          isLastButton ? 'rounded-r-md' : ''
        }`}
      >
        {isHidden ? (
          <EyeOffIcon className="w-5 h-5" />
        ) : (
          <EyeIcon className="w-5 h-5" />
        )}
      </button>
    </>
  );
};

export default SensitiveInput;
