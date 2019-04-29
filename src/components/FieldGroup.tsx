/** @jsx jsx */
import { css, jsx } from "@emotion/core";

interface Props {
  field: any;
  style?: any;
}

function FieldGroup({ field, style }: Props) {
  return (
    <div css={styles.fieldGroup}>
      <input
        css={[styles.fieldInput, style]}
        type="number"
        pattern="[0-9]"
        {...field.input}
      />
    </div>
  );
}

const styles = {
  fieldGroup: css({
    width: 62,
    height: 22,
    display: "flex"
  }),
  fieldInput: css({
    appearance: "none",
    border: "solid black 1px",
    width: "100%",
    fontSize: 14,
    textAlign: "center"
  })
};

export default FieldGroup;
