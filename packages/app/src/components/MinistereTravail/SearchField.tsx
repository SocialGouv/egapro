/** @jsx jsx */
import { ChangeEventHandler, FC } from "react";
import { css, jsx } from "@emotion/core";

interface FieldProps {
  name: string;
  onChange?: ChangeEventHandler;
  placeholder?: string;
  value?: string;
}

const SearchField: FC<FieldProps> = ({
  name,
  onChange,
  placeholder,
  value
}) => (
  <input
    name={name}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    css={styles.fieldMinistere}
    type="text"
  />
);

const styles = {
  fieldMinistere: css({
    width: "200px",
    height: "40px",
    paddingLeft: "10px",
    border: "unset",
    // Remove the clear field cross from IE.
    "::-ms-clear": {
      display: "none",
    }
  })
};

export default SearchField;
