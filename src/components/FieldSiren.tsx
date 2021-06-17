/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useField } from "react-final-form";
import Input, { hasFieldError } from "./Input";

import globalStyles from "../utils/globalStyles";

import {
  composeValidators,
  required,
  simpleMemoize,
  ValidatorFunction,
} from "../utils/formHelpers";
import { validateSiren } from "../utils/api";
import { entrepriseData } from "../views/InformationsEntreprise/InformationsEntrepriseForm";
import { useEffect, useState } from "react";
import { FormApi } from "final-form";

const nineDigits: ValidatorFunction = (value) =>
  value.length === 9
    ? undefined
    : "ce champ n’est pas valide, renseignez un numéro SIREN de 9 chiffres";

const memoizedValidateSiren = simpleMemoize(
  async (siren: string) => await validateSiren(siren)
);

function FieldSiren({
  name,
  label,
  readOnly,
  form,
}: {
  name: string;
  label: string;
  readOnly: boolean;
  form: FormApi<any>;
}) {
  const [sirenData, updateSirenData] = useState({} as entrepriseData);

  const checkSiren = async (siren: string) => {
    try {
      const result = await memoizedValidateSiren(siren);
      updateSirenData(result.jsonBody);
      return undefined;
    } catch (error) {
      updateSirenData({});
      return `Numéro SIREN invalide: ${siren}`;
    }
  };

  useEffect(() => {
    form.batch(() => {
      form.change("nomEntreprise", sirenData.raison_sociale || "");
      form.change("codeNaf", sirenData.code_naf || "");
      form.change("region", sirenData.région || "");
      form.change("departement", sirenData.département || "");
      form.change("adresse", sirenData.adresse || "");
      form.change("commune", sirenData.commune || "");
      form.change("codePostal", sirenData.code_postal || "");
    });
  }, [sirenData, form]);

  const field = useField(name, {
    validate: composeValidators(required, nineDigits, checkSiren),
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
