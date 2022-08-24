/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"
import { ReactNode } from "react"
import { useField } from "react-final-form"

import globalStyles from "../utils/globalStyles"

function RadioField({
  fieldName,
  label,
  choiceValue,
  disabled,
}: {
  fieldName: string
  label: ReactNode
  choiceValue: string
  disabled: boolean
}) {
  const { input } = useField(fieldName, { type: "radio", value: choiceValue })
  return (
    <label css={styles.label}>
      <input css={styles.radio} {...input} disabled={disabled} />
      <div css={[styles.fakeRadio, input.checked && styles.fakeRadioChecked]} />
      <span css={styles.labelText}>{label}</span>
    </label>
  )
}

export type RadioButtonChoice = {
  label: string
  value: string
}

interface Props {
  readOnly: boolean
  fieldName: string
  label: string
  value: string
  choices: RadioButtonChoice[]
}

function RadioButtons({ readOnly, fieldName, label, value, choices }: Props) {
  return (
    <div css={styles.container}>
      <p css={styles.headerLabel}>{label}</p>
      {choices.map(({ label: choiceLabel, value: choiceValue }) => (
        <div
          key={choiceLabel}
          css={[styles.radioField, readOnly && value !== choiceValue && styles.radioFieldDisabled]}
        >
          <RadioField fieldName={fieldName} label={choiceLabel} choiceValue={choiceValue} disabled={readOnly} />
        </div>
      ))}
    </div>
  )
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    marginBottom: 20,
  }),
  headerLabel: css({
    marginBottom: 10,
  }),
  radioField: css({
    marginTop: 9,
    "&:first-of-type": {
      marginTop: 0,
    },
  }),
  label: css({
    display: "flex",
    fontSize: 14,
    cursor: "pointer",
  }),
  labelText: css({
    lineHeight: "16px",
  }),
  radio: css({
    display: "none",
  }),
  fakeRadio: css({
    width: 16,
    height: 16,
    flexShrink: 0,
    marginRight: 6,
    borderRadius: 8,
    backgroundColor: "white",
    border: `solid ${globalStyles.colors.default} 1px`,
  }),
  fakeRadioChecked: css({
    backgroundImage: `radial-gradient(${globalStyles.colors.default} 0%, ${globalStyles.colors.default} 3px, #FFF 3px)`,
  }),
  radioFieldDisabled: css({
    border: "0px",
    clip: "rect(0px, 0px, 0px, 0px)",
    height: "1px",
    width: "1px",
    margin: "-1px",
    padding: "0px",
    overflow: "hidden",
    whiteSpace: "nowrap",
    position: "absolute",
  }),
}

export default RadioButtons
