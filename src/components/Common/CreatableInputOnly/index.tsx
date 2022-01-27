import React, { KeyboardEvent, useState } from 'react';
import { MultiValue } from 'react-select';
import CreatableSelect from 'react-select/creatable';

type OptionType = {
  label: string;
  value: string;
};

type CreatableInputOnlyProps = {
  value: OptionType[];
  placeholder: string;
  fieldName: string;
  setFieldValue: (field: string, value: unknown) => void;
};

const CreatableInputOnly: React.FC<CreatableInputOnlyProps> = ({
  value,
  placeholder,
  fieldName,
  setFieldValue,
}) => {
  const [currentInput, setCurrentInput] = useState('');

  const handleChange = (value: MultiValue<OptionType>) => {
    setFieldValue(
      fieldName,
      value.map((val) => val.value)
    );
  };

  const handleInputChange = (input: string) => {
    setCurrentInput(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!currentInput) {
      return;
    }

    switch (e.key) {
      case 'Enter':
      case 'Tab': {
        setFieldValue(fieldName, [
          ...value.map((val) => val.value),
          currentInput,
        ]);
        setCurrentInput('');
        e.preventDefault();
      }
    }
  };

  return (
    <CreatableSelect<OptionType, true>
      components={{ DropdownIndicator: null }}
      isMulti
      isClearable
      menuIsOpen={false}
      onChange={handleChange}
      onInputChange={handleInputChange}
      onKeyDown={handleKeyDown}
      className="react-select-container"
      classNamePrefix="react-select"
      placeholder={placeholder}
      value={value}
      inputValue={currentInput}
    />
  );
};

export default CreatableInputOnly;
