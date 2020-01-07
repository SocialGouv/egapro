/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Form } from "react-final-form";

import { AppState, FormState, ActionDeclarationData } from "../../globals";

import ActionBar from "../../components/ActionBar";
import ActionLink from "../../components/ActionLink";
import FormAutoSave from "../../components/FormAutoSave";
import FormSubmit from "../../components/FormSubmit";

///////////////////
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
  const initialValues: ActionDeclarationData = {};

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
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ handleSubmit, hasValidationErrors, submitFailed }) => (
        <form onSubmit={handleSubmit} css={styles.container}>
          <FormAutoSave saveForm={saveForm} />

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

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column"
  }),
  edit: css({
    marginTop: 14,
    marginBottom: 14,
    textAlign: "center"
  })
};

export default DeclarationForm;
