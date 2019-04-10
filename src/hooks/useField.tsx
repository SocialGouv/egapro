import { useState, ChangeEvent } from "react";

export interface stateFieldType {
  input: {
    type: string;
    pattern: string;
    name: string;
    value: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    onFocus: () => void;
  };
  meta: {
    valueNumber: number;
    active: boolean;
    dirty: boolean;
    touched: boolean;
  };
}

function useField(name: string, defaultValue: string = ""): stateFieldType {
  const [value, setValue] = useState(defaultValue);

  const [active, setActive] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [touched, setTouched] = useState(false);
  //const [valid, setValid] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setValue(value);
    setDirty(value !== defaultValue);
  };

  const handleBlur = () => {
    setTouched(true);
    setActive(false);
  };

  const handleFocus = () => {
    setActive(true);
  };

  return {
    input: {
      type: "number",
      pattern: "[0-9]",
      name,
      value,
      onChange: handleChange,
      onBlur: handleBlur,
      onFocus: handleFocus
    },
    meta: {
      valueNumber: value ? parseInt(value, 10) : 0,
      active,
      dirty,
      touched
    }
  };
}

export default useField;
