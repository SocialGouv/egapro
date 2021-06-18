/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useField } from "react-final-form";

import globalStyles from "../../../utils/globalStyles";

import { hasFieldError } from "../../../components/Input";
import FieldSiren, { sirenValidator } from "../../../components/FieldSiren";
import TextField from "../../../components/TextField";
import { EntrepriseUES } from "../../../globals";
import { entrepriseData } from "../InformationsEntrepriseForm";
import { composeValidators, required } from "../../../utils/formHelpers";

function EntrepriseUESInput({
  nom,
  siren,
  index,
  readOnly,
  updateSirenData,
}: {
  nom: string;
  siren: string;
  index: number;
  readOnly: boolean;
  updateSirenData: (sirenData: entrepriseData) => void;
}) {
  const checkDuplicates = (value: string, allValues: any) => {
    let sirenList = allValues.entreprisesUES.map(
      (entreprise: EntrepriseUES) => entreprise.siren
    );
    sirenList.push(allValues.siren);
    if (sirenList.filter((siren: string) => siren === value).length >= 2) {
      return "ce numéro SIREN est déjà utilisé";
    }
    return undefined;
  };

  const nomField = useField(nom, {
    validate: required,
    parse: (value) => value,
    format: (value) => value,
  });
  const nomError = hasFieldError(nomField.meta);

  return (
    <div css={styles.inputField}>
      <label
        css={[styles.label, nomError && styles.labelError]}
        htmlFor={nomField.input.name}
      >
        {`Entreprise ${index + 1}`}
      </label>

      <div css={styles.fieldRow}>
        <FieldSiren
          label="Siren de l'entreprise"
          name={siren}
          readOnly={readOnly}
          updateSirenData={updateSirenData}
          validator={composeValidators(
            checkDuplicates,
            sirenValidator(updateSirenData)
          )}
        />
        <TextField
          label="Nom de l'entreprise"
          fieldName={nom}
          readOnly={true}
          errorText="le nom n'est pas valide"
        />
      </div>
    </div>
  );
}

const styles = {
  inputField: css({
    alignSelf: "stretch",
  }),
  label: css({
    fontSize: 14,
    lineHeight: "17px",
  }),
  labelError: css({
    color: globalStyles.colors.error,
  }),
  fieldRow: css({
    height: 100,
    marginTop: 5,
    display: "flex",
    justifyContent: "space-between",
  }),
  delete: css({
    marginLeft: globalStyles.grid.gutterWidth,
  }),
  error: css({
    height: 18,
    color: globalStyles.colors.error,
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: "15px",
  }),
};

export default EntrepriseUESInput;
