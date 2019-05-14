/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useField, FieldRenderProps } from "react-final-form-hooks";
import { FormApi } from "final-form";

import globalStyles from "../utils/globalStyles";

function RadioField({
  field: { input },
  label,
  value
}: {
  field: FieldRenderProps;
  label: string;
  value: string;
}) {
  const checked = input.value === value;
  return (
    <label css={styles.label}>
      <input
        css={styles.radio}
        {...input}
        type="radio"
        value={value}
        checked={checked}
      />
      <div css={[styles.fakeRadio, checked && styles.fakeRadioChecked]} />
      <span>{label}</span>
    </label>
  );
}

interface Props {
  form: FormApi;
  readOnly: boolean;
  fieldName: string;
  labelTrue: string;
  labelFalse: string;
}

function RadiosBoolean({
  form,
  readOnly,
  fieldName,
  labelTrue,
  labelFalse
}: Props) {
  const field = useField(fieldName, form);
  return (
    <div css={styles.container}>
      <RadioField field={field} label={labelTrue} value="true" />
      <div css={styles.spacer} />
      <RadioField field={field} label={labelFalse} value="false" />
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
    alignItems: "center",
    fontSize: 14,
    cursor: "pointer"
  }),
  spacer: css({
    height: 9
  }),
  radio: css({
    display: "none"
  }),
  fakeRadio: css({
    width: 16,
    height: 16,
    marginRight: 6,
    borderRadius: 8,
    backgroundColor: "white",
    border: `solid ${globalStyles.colors.default} 1px`
  }),
  fakeRadioChecked: css({
    backgroundImage: `radial-gradient(${globalStyles.colors.default} 0%, ${
      globalStyles.colors.default
    } 3px, #FFF 3px)`
  })
};

export default RadiosBoolean;
