import { EyeIcon, EyeOffIcon } from '@heroicons/react/solid';
import { Field } from 'formik';
import React, { useState } from 'react';

interface CustomInputProps extends React.ComponentProps<'input'> {
  as?: 'input';
}

interface CustomFieldProps extends React.ComponentProps<typeof Field> {
  as?: 'field';
}

type SensitiveInputProps = CustomInputProps | CustomFieldProps;

const SensitiveInput: React.FC<SensitiveInputProps> = ({
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
        className={`rounded-l-only ${componentProps.className ?? ''}`}
        type={
          isHidden
            ? 'password'
            : props.type !== 'password'
            ? props.type ?? 'text'
            : 'text'
        }
      />
      <button
        onClick={(e) => {
          e.preventDefault();
          setHidden(!isHidden);
        }}
        type="button"
        className="input-action"
      >
        {isHidden ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </>
  );
};

export default SensitiveInput;
