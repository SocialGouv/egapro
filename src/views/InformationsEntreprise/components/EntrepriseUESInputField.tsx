/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useField } from "react-final-form";

import globalStyles from "../../../utils/globalStyles";

import { hasFieldError } from "../../../components/Input";
import { sirenValidator } from "../../../components/FieldSiren";
import FieldSiren from "../../../components/FieldSiren";
import TextField from "../../../components/TextField";
import { EntrepriseUES } from "../../../globals";

function InputField({
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
  updateSirenData: (data: object) => void;
}) {
  const validateSiren = (value: string, allValues: any) => {
    const sirenInvalidError = sirenValidator(updateSirenData)(value);
    if (sirenInvalidError) {
      return sirenInvalidError;
    }
    let sirenList = allValues.entreprisesUES.map(
      (entreprise: EntrepriseUES) => entreprise.siren
    );
    sirenList.push(allValues.siren);
    if (sirenList.filter((siren: string) => siren === value).length >= 2) {
      return { duplicate: true };
    }
    return undefined;
  };

  const nomField = useField(nom, {
    validate: validateSiren,
    parse: (value) => value,
    format: (value) => value,
  });
  const nomError = hasFieldError(nomField.meta);
  const sirenField = useField(siren, {
    validate: validateSiren,
    parse: (value) => value,
    format: (value) => value,
  });
  const sirenError = hasFieldError(sirenField.meta);

  return (
    <div css={styles.inputField}>
      <label
        css={[styles.label, (nomError || sirenError) && styles.labelError]}
        htmlFor={nomField.input.name}
      >
        {`Entreprise ${index + 1}`}
      </label>

      <div css={styles.fieldRow}>
        <TextField
          label="Nom de l'entreprise"
          fieldName={nom}
          readOnly={readOnly}
          errorText="le nom n'est pas valide"
        />
        <FieldSiren
          label="Siren de l'entreprise"
          name={siren}
          readOnly={readOnly}
          updateSirenData={updateSirenData}
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

export default InputField;
