/** @jsx jsx */
import { Fragment } from "react";
import { css, jsx } from "@emotion/core";
import { Form } from "react-final-form";

import { AppState, FormState, ActionDeclarationData } from "../../globals";

import ActionBar from "../../components/ActionBar";
import ActionLink from "../../components/ActionLink";
import FieldDate from "../../components/FieldDate";
import FormAutoSave from "../../components/FormAutoSave";
import FormSubmit from "../../components/FormSubmit";
import Textarea from "../../components/Textarea";
import MesuresCorrection from "../../components/MesuresCorrection";

///////////////////
interface Props {
  declaration: AppState["declaration"];
  noteIndex: number | undefined;
  indicateurUnParCSP: boolean;
  readOnly: boolean;
  updateDeclaration: (data: ActionDeclarationData) => void;
  validateDeclaration: (valid: FormState) => void;
}

function DeclarationForm({
  declaration,
  noteIndex,
  indicateurUnParCSP,
  readOnly,
  updateDeclaration,
  validateDeclaration
}: Props) {
  const initialValues = {
    mesuresCorrection: declaration.mesuresCorrection,
    dateConsultationCSE: declaration.dateConsultationCSE,
    datePublication: declaration.datePublication,
    lienPublication: declaration.lienPublication
  };

  const saveForm = (formData: any) => {
    const {
      mesuresCorrection,
      dateConsultationCSE,
      datePublication,
      lienPublication
    } = formData;

    updateDeclaration({
      mesuresCorrection,
      dateConsultationCSE,
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

          {noteIndex !== undefined && noteIndex < 75 && (
            <MesuresCorrection
              label="Mesures de corrections prévues à l'article D. 1142-5"
              name="mesuresCorrection"
              readOnly={readOnly}
            />
          )}

          {!indicateurUnParCSP && (
            <FieldDate
              name="dateConsultationCSE"
              label="Date de consultation du CSE"
              readOnly={readOnly}
            />
          )}

          {noteIndex !== undefined && (
            <Fragment>
              <FieldDate
                name="datePublication"
                label="Date de publication de cet index"
                readOnly={readOnly}
              />
              <Textarea
                label="Adresse du site internet de publication ou à défaut précision des modalités de publicité"
                fieldName="lienPublication"
                errorText="Veuillez entrer une adresse internet ou préciser les modalités de publicité"
                readOnly={readOnly}
              />
            </Fragment>
          )}

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
                label="déclarer"
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
