/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { FieldRenderProps } from "react-final-form-hooks";

import { Cell } from "./Cell";

interface Props {
  field: FieldRenderProps;
  style?: any;
}

function CellInput({ field, style }: Props) {
  return (
    <Cell style={styles.cell}>
      <input
        css={[styles.input, style]}
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
    border: "solid black 1px",
    width: "100%",
    fontSize: 14,
    textAlign: "center"
  })
};

export default CellInput;
