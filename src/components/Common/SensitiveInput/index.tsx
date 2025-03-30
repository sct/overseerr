import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import { Field } from 'formik';
import { useState } from 'react';

interface CustomInputProps extends React.ComponentProps<'input'> {
  as?: 'input';
  allowAutoComplete?: boolean;
}

interface CustomFieldProps extends React.ComponentProps<typeof Field> {
  as?: 'field';
  allowAutoComplete?: boolean;
}

type SensitiveInputProps = CustomInputProps | CustomFieldProps;

const SensitiveInput = ({
  as = 'input',
  allowAutoComplete = false,
  ...props
}: SensitiveInputProps) => {
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
        {...(allowAutoComplete
          ? {}
          : {
              autoComplete: 'off',
              'data-1pignore': 'true',
              'data-lpignore': 'true',
              'data-bwignore': 'true',
            })}
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
        {isHidden ? <EyeSlashIcon /> : <EyeIcon />}
      </button>
    </>
  );
};

export default SensitiveInput;
