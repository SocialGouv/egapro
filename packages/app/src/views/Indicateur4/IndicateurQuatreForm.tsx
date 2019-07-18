/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment } from "react";
import { Form } from "react-final-form";
import {
  AppState,
  FormState,
  ActionIndicateurQuatreData
} from "../../globals.d";

import {
  parseIntFormValue,
  parseIntStateValue,
  parseBooleanFormValue,
  parseBooleanStateValue,
  required,
  mustBeNumber,
  maxNumber
} from "../../utils/formHelpers";

import { BlocFormLight } from "../../components/BlocForm";
import FieldInput, {
  HEIGHT as FieldInputHeight,
  MARGIN_TOP as FieldInputMarginTop
} from "../../components/FieldInput";
import RadiosBoolean from "../../components/RadiosBoolean";
import ActionBar from "../../components/ActionBar";
import FormAutoSave from "../../components/FormAutoSave";
import FormSubmit from "../../components/FormSubmit";
import { ButtonSimulatorLink } from "../../components/SimulatorLink";

const validate = (value: string) => {
  const requiredError = required(value);
  const mustBeNumberError = mustBeNumber(value);
  if (!requiredError && !mustBeNumberError) {
    return undefined;
  } else {
    return { required: requiredError, mustBeNumber: mustBeNumberError };
  }
};

const validateWithPreviousField = (
  value: string,
  valuePreviousField: string
) => {
  const requiredError = required(value);
  const mustBeNumberError = mustBeNumber(value);
  const maxNumberError = maxNumber(value, Number(valuePreviousField));
  if (!requiredError && !mustBeNumberError && !maxNumberError) {
    return undefined;
  } else {
    return {
      required: requiredError,
      mustBeNumber: mustBeNumberError,
      previousField: maxNumberError
    };
  }
};

const validateForm = ({
  presenceCongeMat,
  nombreSalarieesPeriodeAugmentation,
  nombreSalarieesAugmentees
}: {
  presenceCongeMat: string;
  nombreSalarieesPeriodeAugmentation: string;
  nombreSalarieesAugmentees: string;
}) => {
  if (presenceCongeMat === "false") {
    return undefined;
  }
  return {
    nombreSalarieesPeriodeAugmentation: validate(
      nombreSalarieesPeriodeAugmentation
    ),
    nombreSalarieesAugmentees: validateWithPreviousField(
      nombreSalarieesAugmentees,
      nombreSalarieesPeriodeAugmentation
    )
  };
};

///////////////

interface Props {
  indicateurQuatre: AppState["indicateurQuatre"];
  readOnly: boolean;
  updateIndicateurQuatre: (data: ActionIndicateurQuatreData) => void;
  validateIndicateurQuatre: (valid: FormState) => void;
}

function IndicateurQuatreForm({
  indicateurQuatre,
  readOnly,
  updateIndicateurQuatre,
  validateIndicateurQuatre
}: Props) {
  const initialValues = {
    presenceCongeMat: parseBooleanStateValue(indicateurQuatre.presenceCongeMat),
    nombreSalarieesPeriodeAugmentation: parseIntStateValue(
      indicateurQuatre.nombreSalarieesPeriodeAugmentation
    ),
    nombreSalarieesAugmentees: parseIntStateValue(
      indicateurQuatre.nombreSalarieesAugmentees
    )
  };

  const saveForm = (formData: any) => {
    const {
      presenceCongeMat,
      nombreSalarieesPeriodeAugmentation,
      nombreSalarieesAugmentees
    } = formData;

    updateIndicateurQuatre({
      presenceCongeMat: parseBooleanFormValue(presenceCongeMat),
      nombreSalarieesPeriodeAugmentation: parseIntFormValue(
        nombreSalarieesPeriodeAugmentation
      ),
      nombreSalarieesAugmentees: parseIntFormValue(nombreSalarieesAugmentees)
    });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateIndicateurQuatre("Valid");
  };

  return (
    <Form
      onSubmit={onSubmit}
      validate={validateForm}
      initialValues={initialValues}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ handleSubmit, values, hasValidationErrors, submitFailed }) => (
        <form onSubmit={handleSubmit} css={styles.container}>
          <FormAutoSave saveForm={saveForm} />
          <RadiosBoolean
            fieldName="presenceCongeMat"
            value={values.presenceCongeMat}
            readOnly={readOnly}
            labelTrue={
              <Fragment>
                <strong>il y a eu des retours de congé maternité</strong>{" "}
                pendant la période de référence
              </Fragment>
            }
            labelFalse={
              <Fragment>
                <strong>il n’y a pas eu de retour de congé maternité</strong>{" "}
                pendant la période de référence
              </Fragment>
            }
          />

          {values.presenceCongeMat === "true" && (
            <BlocFormLight>
              <FieldInput
                fieldName="nombreSalarieesPeriodeAugmentation"
                label="parmi ces retours, combien étaient en congé maternité pendant qu'il y a eu une/ou des augmentations salariales dans l'entreprise ?"
                readOnly={readOnly}
              />
              <div css={styles.spacer} />
              <FieldInput
                fieldName="nombreSalarieesAugmentees"
                label="parmi ces salariées, combien ont bénéficié d’une augmentation à leur retour de congé maternité ?"
                readOnly={readOnly}
              />
            </BlocFormLight>
          )}

          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/indicateur5" label="suivant" />
            </ActionBar>
          ) : (
            <ActionBar>
              <FormSubmit
                hasValidationErrors={hasValidationErrors}
                submitFailed={submitFailed}
                errorMessage="L’indicateur ne peut pas être validé si tous les champs ne sont pas remplis."
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
  spacer: css({
    height: 8
  }),
  emptyFields: css({
    height: (FieldInputHeight + FieldInputMarginTop) * 2
  })
};

export default IndicateurQuatreForm;
