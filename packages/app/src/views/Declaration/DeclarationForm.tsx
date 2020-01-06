/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Form, useField } from "react-final-form";

import { AppState, FormState, ActionDeclarationData } from "../../globals";

import ActionBar from "../../components/ActionBar";
import ActionLink from "../../components/ActionLink";
import FieldDate from "../../components/FieldDate";
import FormAutoSave from "../../components/FormAutoSave";
import FormSubmit from "../../components/FormSubmit";
import Input, { hasFieldError } from "../../components/Input";
import { required } from "../../utils/formHelpers";
import globalStyles from "../../utils/globalStyles";

///////////////////

const validate = (value: string) => {
  const requiredError = required(value);
  if (!requiredError) {
    return undefined;
  } else {
    return {
      required: requiredError
    };
  }
};

const validateForm = ({
  datePublication,
  lienPublication
}: {
  datePublication: string;
  lienPublication: string;
}) => ({
  datePublication: validate(datePublication),
  lienPublication: validate(lienPublication)
});

interface Props {
  declaration: AppState["declaration"];
  readOnly: boolean;
  updateDeclaration: (data: ActionDeclarationData) => void;
  validateDeclaration: (valid: FormState) => void;
}

function DeclarationForm({
  declaration,
  readOnly,
  updateDeclaration,
  validateDeclaration
}: Props) {
  const initialValues: ActionDeclarationData = {
    datePublication: declaration.datePublication,
    lienPublication: declaration.lienPublication
  };

  const saveForm = (formData: any) => {
    const { datePublication, lienPublication } = formData;

    updateDeclaration({
      datePublication,
      lienPublication
    });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateDeclaration("Valid");
  };

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={initialValues}
      validate={validateForm}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ handleSubmit, hasValidationErrors, submitFailed }) => (
        <form onSubmit={handleSubmit} css={styles.container}>
          <FormAutoSave saveForm={saveForm} />
          <FieldDate
            name="datePublication"
            label="Date de publication de cet index"
            readOnly={readOnly}
          />
          <FieldLienPublication readOnly={readOnly} />

          {readOnly ? (
            <ActionBar>
              Votre déclaration est maintenant finalisée, en date du{" "}
              {declaration.dateDeclaration}. &emsp;
              {declaration.formValidated === "Valid" && (
                <p css={styles.edit}>
                  <ActionLink onClick={() => validateDeclaration("None")}>
                    modifier les données saisies
                  </ActionLink>
                </p>
              )}
            </ActionBar>
          ) : (
            <ActionBar>
              <FormSubmit
                hasValidationErrors={hasValidationErrors}
                submitFailed={submitFailed}
                errorMessage="Le formulaire ne peut pas être validé si tous les champs ne sont pas remplis."
              />
            </ActionBar>
          )}
        </form>
      )}
    </Form>
  );
}

function FieldLienPublication({ readOnly }: { readOnly: boolean }) {
  const field = useField("lienPublication", {
    validate
  });
  const error = hasFieldError(field.meta);

  return (
    <div css={styles.formField}>
      <label
        css={[styles.label, error && styles.labelError]}
        htmlFor={field.input.name}
      >
        Lien de publication
      </label>
      <div css={styles.fieldRow}>
        <Input field={field} readOnly={readOnly} />
      </div>
      <p css={styles.error}>
        {error && "Le lien de publication n'est pas valide"}
      </p>
    </div>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column"
  }),
  edit: css({
    marginTop: 14,
    marginBottom: 14,
    textAlign: "center"
  }),
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

export default DeclarationForm;
