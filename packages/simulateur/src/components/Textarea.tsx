/** @jsx jsx */
import { css, jsx } from "@emotion/react"
import { Textarea } from "@chakra-ui/react"
import { Field } from "react-final-form"
import { required } from "../utils/formHelpers"

import globalStyles from "../utils/globalStyles"

function TextField({
  errorText,
  fieldName,
  label,
  readOnly,
}: {
  errorText: string
  fieldName: string
  label: string
  readOnly: boolean
}) {
  return (
    <Field name={fieldName} validate={required} component="textarea">
      {({ input, meta }) => (
        <div css={styles.formField}>
          <label css={[styles.label, meta.error && meta.touched && styles.labelError]} htmlFor={input.name}>
            {label}
          </label>
          <div css={styles.fieldRow}>
            <Textarea {...input} readOnly={readOnly} />
          </div>
          {meta.error && meta.touched && <p css={styles.error}>{errorText}</p>}
        </div>
      )}
    </Field>
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
    textarea: {
      borderRadius: 4,
      border: "1px solid",
      width: "100%",
    },
    "textarea[readonly]": {
      border: 0,
      borderRadius: 4,
    },
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
