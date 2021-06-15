/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useField } from "react-final-form";
import Input, { hasFieldError } from "./Input";

import globalStyles from "../utils/globalStyles";

import {
  composeValidators,
  required,
  ValidatorFunction,
} from "../utils/formHelpers";
import { validateSiren } from "../utils/api";

const nineDigits: ValidatorFunction = (value) =>
  value.length === 9
    ? undefined
    : "ce champ n’est pas valide, renseignez un numéro SIREN de 9 chiffres";

export const sirenValidator = (updateSirenData: (data: object) => void) => {
  return composeValidators(required, nineDigits, async (siren: string) => {
    try {
      const result = await validateSiren(siren);
      updateSirenData(result.jsonBody);
      console.log("siren: ", result);
      return undefined;
    } catch (error) {
      console.log("error: ", error.jsonBody.error);
      updateSirenData({});
      return `Numéro SIREN invalide: ${siren}`;
    }
  });
};

function FieldSiren({
  name,
  label,
  readOnly,
  updateSirenData,
}: {
  name: string;
  label: string;
  readOnly: boolean;
  updateSirenData: (data: object) => void;
}) {
  const validator = sirenValidator(updateSirenData);
  const field = useField(name, {
    validate: validator,
  });
  const error = hasFieldError(field.meta);

  return (
    <div css={styles.formField}>
      <label
        css={[styles.label, error && styles.labelError]}
        htmlFor={field.input.name}
      >
        {label}
      </label>
      <div css={styles.fieldRow}>
        <Input field={field} readOnly={readOnly} />
      </div>
      {error && <p css={styles.error}>{field.meta.error}</p>}
    </div>
  );
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
};

export default FieldSiren;
