/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useField } from "react-final-form";

import { required } from "../../../../utils/formHelpers";
import globalStyles from "../../../../utils/globalStyles";

import Input, { hasFieldError } from "../../../../components/Input";
import ActionLink from "../../../../components/ActionLink";

const validate = (value: string) => {
  const requiredError = required(value);

  if (!requiredError) {
    return undefined;
  } else {
    return { required: requiredError };
  }
};

function InputField({
  name,
  index,
  deleteGroup,
  readOnly
}: {
  name: string;
  index: number;
  deleteGroup: (index: number) => void;
  readOnly: boolean;
}) {
  const field = useField(name, { validate });
  const error = hasFieldError(field.meta);

  return (
    <div css={styles.inputField}>
      <label
        css={[styles.label, error && styles.labelError]}
        htmlFor={field.input.name}
      >
        {`Groupe ${index + 1}`}
      </label>

      {readOnly ? (
        <div css={styles.fieldRow}>
          <div css={styles.fakeInput}>{field.input.value}</div>
        </div>
      ) : (
        <div css={styles.fieldRow}>
          <Input field={field} placeholder="Donnez un nom à votre groupe" />
          <ActionLink onClick={() => deleteGroup(index)} style={styles.delete}>
            supprimer le groupe
          </ActionLink>
        </div>
      )}

      <p css={styles.error}>
        {error && "vous devez donner un nom à votre groupe"}
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
