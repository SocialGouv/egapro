/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { FieldRenderProps } from "react-final-form-hooks";

import globalStyles from "../utils/globalStyles";

export const hasFieldError = (meta: FieldRenderProps["meta"]) =>
  (meta.error && meta.submitFailed) ||
  (meta.error &&
    meta.touched &&
    Object.values({ ...meta.error, required: false }).includes(true));

interface Props {
  field: FieldRenderProps;
  style?: any;
}

function Input({ field: { input, meta }, style }: Props) {
  const error = hasFieldError(meta);

  return (
    <input
      css={[styles.input, style, error && styles.inputError]}
      autoComplete="off"
      id={input.name}
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
    paddingLeft: 22,
    paddingRight: 22
  }),
  inputError: css({
    color: globalStyles.colors.error,
    borderColor: globalStyles.colors.error
  })
};

export default Input;
