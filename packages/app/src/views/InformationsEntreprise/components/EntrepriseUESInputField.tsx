/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useField } from "react-final-form";

import { required } from "../../../utils/formHelpers";
import globalStyles from "../../../utils/globalStyles";

import { hasFieldError } from "../../../components/Input";
import FieldSiren from "../../../components/FieldSiren";
import TextField from "../../../components/TextField";

const validate = (value: string) => {
  const requiredError = required(value);

  if (!requiredError) {
    return undefined;
  } else {
    return { required: requiredError };
  }
};

function InputField({
  nom,
  siren,
  index,
  readOnly
}: {
  nom: string;
  siren: string;
  index: number;
  readOnly: boolean;
}) {
  const nomField = useField(nom, {
    validate,
    parse: value => value,
    format: value => value
  });
  const nomError = hasFieldError(nomField.meta);
  const sirenField = useField(siren, {
    validate,
    parse: value => value,
    format: value => value
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
        />
      </div>
    </div>
  );
}

const styles = {
  inputField: css({
    alignSelf: "stretch"
  }),
  label: css({
    fontSize: 14,
    lineHeight: "17px"
  }),
  labelError: css({
    color: globalStyles.colors.error
  }),
  fieldRow: css({
    height: 100,
    marginTop: 5,
    display: "flex"
  }),
  delete: css({
    marginLeft: globalStyles.grid.gutterWidth
  }),
  error: css({
    height: 18,
    color: globalStyles.colors.error,
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: "15px"
  })
};

export default InputField;
