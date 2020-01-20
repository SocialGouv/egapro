/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useField } from "react-final-form";
import Input, { hasFieldError } from "./Input";

import globalStyles from "../utils/globalStyles";

import { required } from "../utils/formHelpers";

export const isValidSiren = (value: string): boolean => {
  // https://fr.wikipedia.org/wiki/Syst%C3%A8me_d%27identification_du_r%C3%A9pertoire_des_entreprises#Calcul_et_validit%C3%A9_d'un_num%C3%A9ro_SIREN[3]
  if (Number.isNaN(Number(value))) {
    // Doit être un nombre ...
    return false;
  }
  if (value.length !== 9) {
    // ... composé de 9 chiffres.
    return false;
  }
  const digits = value.split("").map(Number);
  // Appliquer la formule de luhn à chaque digit en position impaire : https://fr.wikipedia.org/wiki/Formule_de_Luhn
  const luhn: Array<number> = digits.map((digit, index) => {
    if (index % 2) {
      const doubled = digit * 2;
      if (doubled >= 10) {
        return doubled - 9;
      }
      return doubled;
    }
    return digit;
  });
  let sum = 0;
  for (let i = 0; i < luhn.length; i++) {
    sum += luhn[i];
  }
  return sum % 10 === 0;
};

export const validateSiren = (value: string) => {
  const requiredError = required(value);
  const mustBeSirenError = !isValidSiren(value);
  if (!requiredError && !mustBeSirenError) {
    return undefined;
  } else {
    return {
      required: requiredError,
      mustBeSiren: mustBeSirenError
    };
  }
};

function FieldSiren({
  name,
  label,
  readOnly
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
      <p css={styles.error}>
        {error &&
          "ce champ n’est pas valide, renseignez un numéro SIREN de 9 chiffres"}
      </p>
    </div>
  );
}

const styles = {
  formField: css({
    marginBottom: 20
  }),
  label: css({
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: "17px"
  }),
  labelError: css({
    color: globalStyles.colors.error
  }),
  fieldRow: css({
    height: 38,
    marginTop: 5,
    marginBottom: 5,
    display: "flex",
    input: {
      borderRadius: 4,
      border: "1px solid"
    },
    "input[readonly]": { border: 0 }
  }),
  error: css({
    height: 18,
    color: globalStyles.colors.error,
    fontSize: 12,
    textDecoration: "underline",
    lineHeight: "15px"
  })
};

export default FieldSiren;
