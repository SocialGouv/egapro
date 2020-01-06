/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Form, useField } from "react-final-form";

import {
  AppState,
  FormState,
  ActionInformationsComplementairesData
} from "../../globals";

import { mustBeDate, required, mustBeNumber } from "../../utils/formHelpers";

import ActionBar from "../../components/ActionBar";
import ActionLink from "../../components/ActionLink";
import FormAutoSave from "../../components/FormAutoSave";
import FormSubmit from "../../components/FormSubmit";
import Input, { hasFieldError } from "../../components/Input";
import FieldDate from "../../components/FieldDate";
import { ButtonSimulatorLink } from "../../components/SimulatorLink";
import globalStyles from "../../utils/globalStyles";

///////////////////

const validateDate = (value: string) => {
  const requiredError = required(value);
  const mustBeDateError = mustBeDate(value);
  if (!requiredError && !mustBeDateError) {
    return undefined;
  } else {
    return {
      required: requiredError,
      mustBeDate: mustBeDateError
    };
  }
};

const validateAnneeDeclaration = (value: string) => {
  const requiredError = required(value);
  const mustBeNumberError = mustBeNumber(value);
  if (!requiredError && !mustBeNumberError) {
    return undefined;
  } else {
    return {
      required: requiredError,
      mustBeNumber: mustBeNumberError
    };
  }
};

const validateForm = ({
  dateConsultationCSE,
  anneeDeclaration
}: {
  dateConsultationCSE: string;
  anneeDeclaration: string;
}) => ({
  dateConsultationCSE: validateDate(dateConsultationCSE),
  anneeDeclaration: validateAnneeDeclaration(anneeDeclaration)
});

interface Props {
  informationsComplementaires: AppState["informationsComplementaires"];
  readOnly: boolean;
  updateInformationsComplementaires: (
    data: ActionInformationsComplementairesData
  ) => void;
  validateInformationsComplementaires: (valid: FormState) => void;
}

function InformationsComplementairesForm({
  informationsComplementaires,
  readOnly,
  updateInformationsComplementaires,
  validateInformationsComplementaires
}: Props) {
  const initialValues: ActionInformationsComplementairesData = {
    dateConsultationCSE: informationsComplementaires.dateConsultationCSE,
    anneeDeclaration: informationsComplementaires.anneeDeclaration
  };

  const saveForm = (formData: any) => {
    const { dateConsultationCSE, anneeDeclaration } = formData;

    updateInformationsComplementaires({
      dateConsultationCSE: dateConsultationCSE,
      anneeDeclaration: anneeDeclaration
    });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateInformationsComplementaires("Valid");
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
            name="dateConsultationCSE"
            label="Date de consultation du CSE"
            readOnly={readOnly}
          />
          <FieldAnneeDeclaration readOnly={readOnly} />

          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/declaration" label="suivant" />
              &emsp;
              {informationsComplementaires.formValidated === "Valid" && (
                <p css={styles.edit}>
                  <ActionLink
                    onClick={() => validateInformationsComplementaires("None")}
                  >
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

function FieldAnneeDeclaration({ readOnly }: { readOnly: boolean }) {
  const field = useField("anneeDeclaration", {
    validate: validateAnneeDeclaration
  });
  const error = hasFieldError(field.meta);

  return (
    <div css={styles.formField}>
      <label
        css={[styles.label, error && styles.labelError]}
        htmlFor={field.input.name}
      >
        Année de déclaration
      </label>
      <div css={styles.fieldRow}>
        <Input field={field} readOnly={readOnly} />
      </div>
      <p css={styles.error}>
        {error && "L'année de déclaration n'erst pas valide"}
      </p>
    </div>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column"
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
  }),
  dates: css({
    display: "flex",
    justifyContent: "space-between"
  }),
  dateField: css({
    marginTop: 5,
    input: {
      display: "flex",
      fontSize: 14,
      paddingLeft: 22,
      paddingRight: 22,
      height: 38,
      marginTop: 5
    }
  }),
  edit: css({
    marginTop: 14,
    marginBottom: 14,
    textAlign: "center"
  })
};

export default InformationsComplementairesForm;
