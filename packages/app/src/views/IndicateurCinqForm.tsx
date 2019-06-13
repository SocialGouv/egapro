/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { memo, useEffect } from "react";
import { useForm } from "react-final-form-hooks";
import createDecorator from "final-form-calculate";

import { AppState, FormState, ActionIndicateurCinqData } from "../globals.d";

import {
  parseIntFormValue,
  parseIntStateValue,
  required,
  mustBeNumber,
  minNumber,
  maxNumber
} from "../utils/formHelpers";

import { BlocFormLight } from "../components/BlocForm";
import FieldInput from "../components/FieldInput";
import ActionBar from "../components/ActionBar";
import FormSubmit from "../components/FormSubmit";
import { ButtonSimulatorLink } from "../components/SimulatorLink";

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

const calculator = createDecorator(
  {
    field: "nombreSalariesFemmes",
    updates: {
      nombreSalariesHommes: (femmesValue, { nombreSalariesHommes }: any) =>
        valueValidateForCalculator(femmesValue)
          ? parseIntStateValue(10 - parseIntFormValue(femmesValue))
          : nombreSalariesHommes
    }
  },
  {
    field: "nombreSalariesHommes",
    updates: {
      nombreSalariesFemmes: (hommesValue, { nombreSalariesFemmes }: any) =>
        valueValidateForCalculator(hommesValue)
          ? parseIntStateValue(10 - parseIntFormValue(hommesValue))
          : nombreSalariesFemmes
    }
  }
);

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

  const { form, handleSubmit, hasValidationErrors, submitFailed } = useForm({
    initialValues,
    onSubmit,
    validate: validateForm
  });

  useEffect(() => {
    const unsubscribe = calculator(form);
    return () => unsubscribe();
  }, [form]);

  form.subscribe(
    ({ values, dirty }) => {
      if (dirty) {
        saveForm(values);
      }
    },
    { values: true, dirty: true }
  );

  return (
    <form onSubmit={handleSubmit} css={styles.container}>
      <BlocFormLight>
        <FieldInput
          form={form}
          fieldName="nombreSalariesFemmes"
          label="nombre de femmes parmis les 10 plus hauts salaires"
          readOnly={readOnly}
        />
        <FieldInput
          form={form}
          fieldName="nombreSalariesHommes"
          label="nombre d’hommes parmis les 10 plus hauts salaires"
          readOnly={readOnly}
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
            errorMessage="vous ne pouvez pas valider l’indicateur tant que vous n’avez pas rempli tous les champs"
          />
        </ActionBar>
      )}
    </form>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column"
  })
};

export default memo(
  IndicateurCinqForm,
  (prevProps, nextProps) => prevProps.readOnly === nextProps.readOnly
);
