/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";
import { useField } from "react-final-form";

import globalStyles from "../utils/globalStyles";

function RadioField({
  fieldName,
  label,
  value,
  disabled
}: {
  fieldName: string;
  label: ReactNode;
  value: string;
  disabled: boolean;
}) {
  const { input } = useField(fieldName, { type: "radio", value });
  return (
    <label css={styles.label}>
      <input css={styles.radio} {...input} disabled={disabled} />
      <div css={[styles.fakeRadio, input.checked && styles.fakeRadioChecked]} />
      <span css={styles.labelText}>{label}</span>
    </label>
  );
}

interface Props {
  readOnly: boolean;
  fieldName: string;
  value: string;
  labelTrue: ReactNode;
  labelFalse: ReactNode;
}

function RadiosBoolean({
  readOnly,
  fieldName,
  value,
  labelTrue,
  labelFalse
}: Props) {
  return (
    <div css={styles.container}>
      <div css={[readOnly && value === "false" && styles.radioFieldDisabled]}>
        <RadioField
          fieldName={fieldName}
          label={labelTrue}
          value="true"
          disabled={readOnly}
        />
      </div>
      <div
        css={[
          styles.radioFieldFalse,
          readOnly && value === "true" && styles.radioFieldDisabled
        ]}
      >
        <RadioField
          fieldName={fieldName}
          label={labelFalse}
          value="false"
          disabled={readOnly}
        />
      </div>
    </div>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column"
  }),
  label: css({
    display: "flex",
    fontSize: 14,
    cursor: "pointer"
  }),
  labelText: css({
    lineHeight: "16px"
  }),
  radio: css({
    display: "none"
  }),
  fakeRadio: css({
    width: 16,
    height: 16,
    flexShrink: 0,
    marginRight: 6,
    borderRadius: 8,
    backgroundColor: "white",
    border: `solid ${globalStyles.colors.default} 1px`
  }),
  fakeRadioChecked: css({
    backgroundImage: `radial-gradient(${globalStyles.colors.default} 0%, ${
      globalStyles.colors.default
    } 3px, #FFF 3px)`
  }),
  radioFieldFalse: css({
    marginTop: 9
  }),
  radioFieldDisabled: css({
    visibility: "hidden"
  })
};

export default RadiosBoolean;
