/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { FieldRenderProps, FieldMetaState } from "react-final-form";

import globalStyles from "../utils/globalStyles";

export const hasFieldError = (meta: FieldMetaState<string>) =>
  (meta.error && meta.submitFailed) ||
  (meta.error &&
    meta.touched &&
    Object.values({ ...meta.error, required: false }).includes(true));

interface Props {
  field: FieldRenderProps<string, HTMLInputElement>;
  placeholder?: string;
  style?: any;
  readOnly?: boolean;
}

function Input({
  field: { input, meta },
  placeholder,
  style,
  readOnly = false
}: Props) {
  const error = hasFieldError(meta);

  return (
    <input
      css={[styles.input, style, error && styles.inputError]}
      autoComplete="off"
      placeholder={placeholder}
      id={input.name}
      readOnly={readOnly}
      {...input}
    />
  );
}

const styles = {
  input: css({
    appearance: "none",
    border: `solid ${globalStyles.colors.default} 1px`,
    width: "100%",
    fontSize: 14,
    lineHeight: "17px",
    paddingLeft: 22,
    paddingRight: 22
  }),
  inputError: css({
    color: globalStyles.colors.error,
    borderColor: globalStyles.colors.error
  })
};

export default Input;
