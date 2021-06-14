/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useField } from "react-final-form";
import Input, { hasFieldError } from "./Input";

import globalStyles from "../utils/globalStyles";

import { isSirenValid, required } from "../utils/formHelpers";

export const isValidSiren = async (value: string): Promise<boolean> => {
  // https://fr.wikipedia.org/wiki/Syst%C3%A8me_d%27identification_du_r%C3%A9pertoire_des_entreprises#Calcul_et_validit%C3%A9_d'un_num%C3%A9ro_SIREN[3]
  if (Number.isNaN(Number(value))) {
    // Doit être un nombre ...
    return false;
  }
  if (value.length !== 9) {
    // ... composé de 9 chiffres.
    return false;
  }
  const result = await isSirenValid(value);
  return !result;
};

export const validateSiren = async (value: string) => {
  const requiredError = required(value);
  const mustBeSirenError = !(await isValidSiren(value));
  if (!requiredError && !mustBeSirenError) {
    return undefined;
  } else {
    return {
      required: requiredError,
      mustBeSiren: mustBeSirenError,
    };
  }
};

function FieldSiren({
  name,
  label,
  readOnly,
}: {
  name: string;
  label: string;
  readOnly: boolean;
}) {
  const field = useField(name, { validate: validateSiren });
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
      {error && (
        <p css={styles.error}>
          {(field.meta.error.mustBeSiren &&
            "ce champ n'est pas un numéro SIREN valide") ||
            (field.meta.error.duplicate &&
              "ce numéro SIREN est déjà utilisé") ||
            "ce champ n’est pas valide, renseignez un numéro SIREN de 9 chiffres"}
        </p>
      )}
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
