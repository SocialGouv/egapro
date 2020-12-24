/** @jsx jsx */
import {ChangeEventHandler, FC} from "react";
import { css, jsx } from "@emotion/core";
import {GREEN} from "./colors";

interface FieldProps {
  onChange: ChangeEventHandler;
  placeholder: string;
  value: string;
}

const Field: FC<FieldProps> = ({
  onChange,
  placeholder,
  value
}) => (
  <input
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
    borderColor: GREEN,
    paddingLeft: "10px"
  })
};

export default Field;
