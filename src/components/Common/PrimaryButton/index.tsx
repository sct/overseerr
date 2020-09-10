import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  buttonType?: 'default' | 'primary' | 'danger' | 'warning' | 'success';
  buttonSize?: 'default' | 'lg' | 'md' | 'sm';
}

const Button: React.FC<ButtonProps> = ({
  buttonType = 'default',
  buttonSize = 'default',
  children,
  className,
  ...props
}) => {
  const buttonStyle = [
    'inline-flex items-center border border-transparent leading-5 font-medium rounded-md focus:outline-none transition ease-in-out duration-150',
  ];
  switch (buttonType) {
    case 'primary':
      buttonStyle.push(
        'text-white bg-indigo-600 hover:bg-indigo-500 focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700'
      );
      break;
    case 'danger':
      buttonStyle.push(
        'text-white bg-red-600 hover:bg-red-500 focus:border-red-700 focus:shadow-outline-red active:bg-red-700'
      );
      break;
    case 'warning':
      buttonStyle.push(
        'text-white bg-orange-500 hover:bg-orange-400 focus:border-orange-700 focus:shadow-outline-orange active:bg-orange-700'
      );
      break;
    case 'success':
      buttonStyle.push(
        'text-white bg-green-400 hover:bg-green-300 focus:border-green-700 focus:shadow-outline-green active:bg-green-700'
      );
      break;
    default:
      buttonStyle.push(
        'border-gray-300 leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50'
      );
  }

  switch (buttonSize) {
    case 'sm':
      buttonStyle.push('px-2.5 py-1.5 text-xs');
      break;
    case 'md':
      buttonStyle.push('px-4 py-2 text-sm');
      break;
    case 'lg':
      buttonStyle.push('px-6 py-3 text-base');
      break;
    default:
      buttonStyle.push('px-4 py-2 text-sm');
  }
  if (className) {
    buttonStyle.push(className);
  }
  return (
    <button className={buttonStyle.join(' ')} {...props}>
      {children}
    </button>
  );
};

export default Button;
