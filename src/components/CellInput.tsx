/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { FieldRenderProps } from "react-final-form-hooks";

import globalStyles from "../utils/globalStyles";

import { Cell } from "./Cell";

interface Props {
  field: FieldRenderProps;
  style?: any;
}

function CellInput({ field, style }: Props) {
  return (
    <Cell style={styles.cell}>
      <input
        css={[
          styles.input,
          style,
          field.meta.error && field.meta.touched && styles.inputError
        ]}
        type="number"
        pattern="[0-9]"
        {...field.input}
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
    borderColor: globalStyles.colors.error
  })
};

export default CellInput;
