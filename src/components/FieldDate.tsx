/** @jsx jsx */
import { Fragment } from "react"
import { css, jsx } from "@emotion/core"
import { useField, Field } from "react-final-form"
import { hasFieldError } from "./Input"

import globalStyles from "../utils/globalStyles"

import { validateDate } from "../utils/formHelpers"
import { dateToString, parseDate } from "../utils/helpers"

import DatePicker, { registerLocale } from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import fr from "date-fns/locale/fr"
registerLocale("fr", fr)

const displayMetaErrors = (error: { [key: string]: string }) => (
  <Fragment>
    {Object.keys(error)
      .map((key) => error[key])
      .join(", ")}
  </Fragment>
)

function FieldDate({ name, label, readOnly }: { name: string; label: string; readOnly: boolean }) {
  const field = useField(name, { validate: validateDate })
  const error = hasFieldError(field.meta)

  return (
    <div css={styles.dateField}>
      <label css={[styles.label, error && styles.labelError]} htmlFor={field.input.name}>
        {label}
      </label>
      <div css={styles.fieldRow}>
        <Field name={name} validate={validateDate}>
          {(props) => (
            <DatePicker
              locale="fr"
              dateFormat="dd/MM/yyyy"
              selected={parseDate(props.input.value)}
              onChange={(date) => (date ? props.input.onChange(dateToString(date)) : "")}
              readOnly={readOnly}
              name={name}
            />
          )}
        </Field>
      </div>
      <p css={styles.error}>{error && displayMetaErrors(field.meta.error)}</p>
    </div>
  )
}

const styles = {
  dateField: css({
    marginTop: 5,
    input: {
      display: "flex",
      fontSize: 14,
      paddingLeft: 22,
      paddingRight: 22,
      height: 38,
      marginTop: 5,
    },
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

export default FieldDate
