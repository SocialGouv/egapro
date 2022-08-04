/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"
import { useField } from "react-final-form"
import Input, { hasFieldError } from "./Input"

import globalStyles from "../utils/globalStyles"

function TextField({
  errorText,
  fieldName,
  label,
  readOnly,
  customStyles,
  autocomplete,
}: {
  errorText: string
  fieldName: string
  label: string
  readOnly: boolean
  customStyles?: any
  autocomplete?: string
}) {
  const field = useField(fieldName)
  const error = hasFieldError(field.meta)

  return (
    <div css={[customStyles, styles.formField]}>
      <label css={[styles.label, error && styles.labelError]} htmlFor={field.input.name}>
        {label}
      </label>
      <div css={styles.fieldRow}>
        <Input field={field} isReadOnly={readOnly} autocomplete={autocomplete} />
      </div>
      {error && errorText && <p css={styles.error}>{error && errorText}</p>}
    </div>
  )
}

const styles = {
  formField: css({
    marginBottom: 20,
  }),
  label: css({
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: "17px",
  }),
  labelError: css({
    color: globalStyles.colors.error,
  }),
  fieldRow: css({
    height: 38,
    marginTop: 5,
    marginBottom: 5,
    display: "flex",
    input: {
      borderRadius: 4,
      border: "1px solid",
    },
    "input[readonly]": { border: 0 },
  }),
  error: css({
    height: 18,
    color: globalStyles.colors.error,
    fontSize: 12,
    textDecoration: "underline",
    lineHeight: "15px",
  }),
}

export default TextField
