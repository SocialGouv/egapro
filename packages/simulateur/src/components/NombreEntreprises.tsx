/** @jsxImportSource @emotion/react */
import { Box } from "@chakra-ui/react"
import { css } from "@emotion/react"
import { Field } from "react-final-form"

import globalStyles from "../utils/globalStyles"

import { composeValidators, minNumber, ValidatorFunction } from "../utils/formHelpers"

const atLeastTwo: ValidatorFunction = (value) =>
  minNumber(2)(value) ? "le nombre d'entreprises composant l'UES doit être un nombre supérieur ou égal à 2" : undefined

export const validator = composeValidators(atLeastTwo)

function NombreEntreprises({ readOnly }: { readOnly: boolean }) {
  return (
    <Field name="nombreEntreprises" validate={validator}>
      {({ input, meta }) => (
        <Box mb={4}>
          <label css={[styles.label, meta.error && styles.labelError]} htmlFor={input.name}>
            Nombre d'entreprises composant l'UES (le déclarant compris)
          </label>
          <div css={styles.fieldRow}>
            <input
              css={[styles.input, meta.error && meta.touched && styles.inputError]}
              value={input.value}
              readOnly={true}
            />
          </div>
          {meta.error && <p css={styles.error}>{meta.error}</p>}
        </Box>
      )}
    </Field>
  )
}

const styles = {
  label: css({
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: "17px",
  }),
  labelError: css({
    color: globalStyles.colors.error,
  }),
  input: css({
    appearance: "none",
    border: `solid ${globalStyles.colors.default} 1px`,
    width: "100%",
    fontSize: 14,
    lineHeight: "17px",
    paddingLeft: 22,
    paddingRight: 22,
  }),
  inputError: css({
    color: globalStyles.colors.error,
    borderColor: globalStyles.colors.error,
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

export default NombreEntreprises
