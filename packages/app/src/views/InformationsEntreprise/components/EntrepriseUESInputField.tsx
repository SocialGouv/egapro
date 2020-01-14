/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useField } from "react-final-form";

import { required } from "../../../utils/formHelpers";
import globalStyles from "../../../utils/globalStyles";

import Input, { hasFieldError } from "../../../components/Input";
import ActionLink from "../../../components/ActionLink";

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
  deleteEntrepriseUES,
  readOnly
}: {
  nom: string;
  siren: string;
  index: number;
  deleteEntrepriseUES: (index: number) => void;
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

      {readOnly ? (
        <div css={styles.fieldRow}>
          <div css={styles.fakeInput}>{nomField.input.value}</div>
          <div css={styles.fakeInput}>{sirenField.input.value}</div>
        </div>
      ) : (
        <div css={styles.fieldRow}>
          <Input field={nomField} placeholder="Nom de cette entreprise" />
          <Input field={sirenField} placeholder="SIREN de cette entreprise" />
          <ActionLink
            onClick={() => deleteEntrepriseUES(index)}
            style={styles.delete}
          >
            supprimer l'entreprise
          </ActionLink>
        </div>
      )}

      <p css={styles.error}>
        {(nomError || sirenError) &&
          "vous devez donner un nom à cette entreprise"}
      </p>
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
    height: 38,
    marginTop: 5,
    marginBottom: 5,
    display: "flex"
  }),
  delete: css({
    flexShrink: 0,
    alignSelf: "flex-end",
    marginLeft: globalStyles.grid.gutterWidth,
    fontSize: 12,
    lineHeight: "15px"
  }),
  error: css({
    height: 18,
    color: globalStyles.colors.error,
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: "15px"
  }),

  fakeInput: css({
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
    paddingLeft: 23,
    paddingRight: 23,

    backgroundColor: "white",
    borderRadius: 5,

    fontSize: 14,
    lineHeight: "38px"
  })
};

export default InputField;
