/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { FieldRenderProps } from "react-final-form-hooks";

import globalStyles from "../utils/globalStyles";

import { Cell } from "./Cell";

export const hasFieldError = (meta: FieldRenderProps["meta"]) =>
  (meta.error && meta.submitFailed) ||
  (meta.error && meta.touched && meta.error.mustBeNumber);

interface Props {
  field: FieldRenderProps;
  style?: any;
}

function CellInput({
  field: {
    input: { value, ...inputProps },
    meta
  },
  style
}: Props) {
  const error = hasFieldError(meta);
  return (
    <Cell style={styles.cell}>
      <input
        css={[styles.input, style, error && styles.inputError]}
        autoComplete="off"
        value={error && !meta.active ? "erreur" : value}
        {...inputProps}
      />
    </Cell>
  );
}

const styles = {
  cell: css({
    height: 22,
    display: "flex"
  }),
  input: css({
    appearance: "none",
    border: `solid ${globalStyles.colors.default} 1px`,
    width: "100%",
    fontSize: 14,
    textAlign: "center"
  }),
  inputError: css({
    color: globalStyles.colors.error,
    borderColor: globalStyles.colors.error
  })
};

export default CellInput;
