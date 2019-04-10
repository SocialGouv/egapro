/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { stateFieldType } from "../hooks/useField";

interface Props {
  label?: string;
  field: stateFieldType;
}

function FieldGroup({ label, field }: Props) {
  return (
    <div css={styles.fieldGroup}>
      {label && (
        <label css={styles.fieldLabel} htmlFor={field.input.name}>
          {label}
        </label>
      )}
      <input css={styles.fieldInput} id={field.input.name} {...field.input} />
    </div>
  );
}

const styles = {
  fieldGroup: css({
    display: "flex",
    flexDirection: "column"
  }),
  fieldLabel: css({
    marginBottom: 6
  }),
  fieldInput: css({
    fontSize: 22,
    padding: "4px 12px",
    textAlign: "center"
  })
};

export default FieldGroup;
