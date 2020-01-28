/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Form } from "react-final-form";

import {
  AppState,
  FormState,
  ActionInformationsComplementairesData
} from "../../globals";

import {
  mustBeDate,
  mustBeNumber,
  required,
  parseIntFormValue,
  parseIntStateValue
} from "../../utils/formHelpers";

import ActionBar from "../../components/ActionBar";
import ActionLink from "../../components/ActionLink";
import AnneeDeclaration from "../../components/AnneeDeclaration";
import FormAutoSave from "../../components/FormAutoSave";
import FormSubmit from "../../components/FormSubmit";
import FieldDate from "../../components/FieldDate";
import TextField from "../../components/TextField";
import { ButtonSimulatorLink } from "../../components/SimulatorLink";

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

const validateInt = (value: string) => {
  const requiredError = required(value);
  const mustBeNumberError = mustBeNumber(value);
  if (!requiredError && !mustBeNumberError) {
    return undefined;
  } else {
    return { required: requiredError, mustBeNumber: mustBeNumberError };
  }
};

interface validateFormParams {
  dateConsultationCSE: string;
  anneeDeclaration: string;
  datePublication: string;
  lienPublication: string;
}

const validateForm = (parCSP: boolean) => {
  // Closure sur parCSP : validateForm est appelé avec le param "parCSP" et
  // renvoie une fonction de validation de formulaire
  const _validateForm = ({
    dateConsultationCSE,
    anneeDeclaration,
    datePublication,
    lienPublication
  }: {
    dateConsultationCSE: string;
    anneeDeclaration: string;
    datePublication: string;
    lienPublication: string;
  }) => ({
    dateConsultationCSE: parCSP ? undefined : validateDate(dateConsultationCSE),
    anneeDeclaration: validateInt(anneeDeclaration),
    datePublication: validateDate(datePublication),
    lienPublication: validate(lienPublication)
  });
  return _validateForm;
};

interface Props {
  informationsComplementaires: AppState["informationsComplementaires"];
  indicateurUnParCSP: boolean;
  readOnly: boolean;
  updateInformationsComplementaires: (
    data: ActionInformationsComplementairesData
  ) => void;
  validateInformationsComplementaires: (valid: FormState) => void;
}

function InformationsComplementairesForm({
  informationsComplementaires,
  indicateurUnParCSP,
  readOnly,
  updateInformationsComplementaires,
  validateInformationsComplementaires
}: Props) {
  const initialValues = {
    dateConsultationCSE: informationsComplementaires.dateConsultationCSE,
    anneeDeclaration: parseIntStateValue(
      informationsComplementaires.anneeDeclaration
    ),
    datePublication: informationsComplementaires.datePublication,
    lienPublication: informationsComplementaires.lienPublication
  };

  const saveForm = (formData: any) => {
    const {
      dateConsultationCSE,
      anneeDeclaration,
      datePublication,
      lienPublication
    } = formData;

    updateInformationsComplementaires({
      dateConsultationCSE,
      anneeDeclaration: parseIntFormValue(anneeDeclaration),
      datePublication,
      lienPublication
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
      validate={validateForm(indicateurUnParCSP)}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ handleSubmit, hasValidationErrors, submitFailed }) => (
        <form onSubmit={handleSubmit} css={styles.container}>
          <FormAutoSave saveForm={saveForm} />
          {!indicateurUnParCSP && (
            <FieldDate
              name="dateConsultationCSE"
              label="Date de consultation du CSE"
              readOnly={readOnly}
            />
          )}
          <AnneeDeclaration
            label="Année de déclaration"
            name="anneeDeclaration"
            readOnly={readOnly}
          />
          <FieldDate
            name="datePublication"
            label="Date de publication de cet index"
            readOnly={readOnly}
          />
          <TextField
            label="Lien de publication"
            fieldName="lienPublication"
            errorText="Le lien de publication n'est pas valide"
            readOnly={readOnly}
          />

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

export default InformationsComplementairesForm;
