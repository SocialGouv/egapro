/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Form } from "react-final-form";
import createDecorator from "final-form-calculate";

import { AppState, FormState, ActionIndicateurCinqData } from "../../globals.d";

import {
  parseIntFormValue,
  parseIntStateValue,
  required,
  mustBeNumber,
  minNumber,
  maxNumber
} from "../../utils/formHelpers";

import { BlocFormLight } from "../../components/BlocForm";
import FieldInput from "../../components/FieldInput";
import ActionBar from "../../components/ActionBar";
import FormAutoSave from "../../components/FormAutoSave";
import FormSubmit from "../../components/FormSubmit";
import { ButtonSimulatorLink } from "../../components/SimulatorLink";

const validate = (value: string) => {
  const requiredError = required(value);
  const mustBeNumberError = mustBeNumber(value);
  const minNumberError = minNumber(value, 0);
  const maxNumberError = maxNumber(value, 10);
  if (
    !requiredError &&
    !mustBeNumberError &&
    !minNumberError &&
    !maxNumberError
  ) {
    return undefined;
  } else {
    return {
      required: requiredError,
      mustBeNumber: mustBeNumberError,
      minNumber: minNumberError,
      maxNumber: maxNumberError
    };
  }
};

const validateForm = ({
  nombreSalariesFemmes,
  nombreSalariesHommes
}: {
  nombreSalariesFemmes: string;
  nombreSalariesHommes: string;
}) => ({
  nombreSalariesFemmes: validate(nombreSalariesFemmes),
  nombreSalariesHommes: validate(nombreSalariesHommes)
});

const valueValidateForCalculator = (value: string) => {
  return validate(value) === undefined;
};

const calculator = createDecorator({
  field: "nombreSalariesFemmes",
  updates: {
    nombreSalariesHommes: (femmesValue, { nombreSalariesHommes }: any) =>
      valueValidateForCalculator(femmesValue)
        ? parseIntStateValue(10 - parseIntFormValue(femmesValue))
        : nombreSalariesHommes
  }
});

///////////////////

interface Props {
  indicateurCinq: AppState["indicateurCinq"];
  readOnly: boolean;
  updateIndicateurCinq: (data: ActionIndicateurCinqData) => void;
  validateIndicateurCinq: (valid: FormState) => void;
}

function IndicateurCinqForm({
  indicateurCinq,
  readOnly,
  updateIndicateurCinq,
  validateIndicateurCinq
}: Props) {
  const initialValues = {
    nombreSalariesHommes: parseIntStateValue(
      indicateurCinq.nombreSalariesHommes
    ),
    nombreSalariesFemmes: parseIntStateValue(
      indicateurCinq.nombreSalariesFemmes
    )
  };

  const saveForm = (formData: any) => {
    const { nombreSalariesHommes, nombreSalariesFemmes } = formData;

    updateIndicateurCinq({
      nombreSalariesHommes: parseIntFormValue(nombreSalariesHommes),
      nombreSalariesFemmes: parseIntFormValue(nombreSalariesFemmes)
    });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateIndicateurCinq("Valid");
  };

  return (
    <Form
      onSubmit={onSubmit}
      decorators={[calculator]}
      validate={validateForm}
      initialValues={initialValues}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ handleSubmit, hasValidationErrors, submitFailed }) => (
        <form onSubmit={handleSubmit} css={styles.container}>
          <FormAutoSave saveForm={saveForm} />
          <BlocFormLight>
            <FieldInput
              fieldName="nombreSalariesFemmes"
              label="nombre de femmes parmi les 10 plus hauts salaires"
              readOnly={readOnly}
            />
            <FieldInput
              fieldName="nombreSalariesHommes"
              label="nombre d’hommes parmi les 10 plus hauts salaires"
              readOnly={true}
              theme="hommes"
            />
          </BlocFormLight>

          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/recapitulatif" label="suivant" />
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
  })
};

export default IndicateurCinqForm;
