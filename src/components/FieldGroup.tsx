/** @jsx jsx */
import { css, jsx } from "@emotion/core";

interface Props {
  label?: string;
  field: any;
}

function FieldGroup({ label, field }: Props) {
  return (
    <div css={styles.fieldGroup}>
      {label && (
        <label css={styles.fieldLabel} htmlFor={field.input.name}>
          {label}
        </label>
      )}
      <input
        css={styles.fieldInput}
        id={field.input.name}
        type="number"
        pattern="[0-9]"
        {...field.input}
      />
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
