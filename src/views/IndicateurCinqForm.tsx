/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { memo } from "react";
import { useForm } from "react-final-form-hooks";
import { AppState, FormState, ActionIndicateurCinqData } from "../globals.d";

import { BlocFormLight } from "../components/BlocForm";
import FieldInput from "../components/FieldInput";
import ActionBar from "../components/ActionBar";
import FormSubmit from "../components/FormSubmit";
import ButtonLink from "../components/ButtonLink";

interface Props {
  indicateurCinq: AppState["indicateurCinq"];
  readOnly: boolean;
  updateIndicateurCinq: (data: ActionIndicateurCinqData) => void;
  validateIndicateurCinq: (valid: FormState) => void;
}

const parseFormValue = (value: string, defaultValue: any = undefined) =>
  value === ""
    ? defaultValue
    : Number.isNaN(Number(value))
    ? defaultValue
    : parseInt(value, 10);

const parseStateValue = (value: number | undefined) =>
  value === undefined ? "" : String(value);

function IndicateurCinqForm({
  indicateurCinq,
  readOnly,
  updateIndicateurCinq,
  validateIndicateurCinq
}: Props) {
  const initialValues = {
    nombreSalariesHommes: parseStateValue(indicateurCinq.nombreSalariesHommes),
    nombreSalariesFemmes: parseStateValue(indicateurCinq.nombreSalariesFemmes)
  };

  const saveForm = (formData: any) => {
    const { nombreSalariesHommes, nombreSalariesFemmes } = formData;

    updateIndicateurCinq({
      nombreSalariesHommes: parseFormValue(nombreSalariesHommes),
      nombreSalariesFemmes: parseFormValue(nombreSalariesFemmes)
    });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateIndicateurCinq("Valid");
  };

  const { form, handleSubmit, hasValidationErrors, submitFailed } = useForm({
    initialValues,
    onSubmit
  });

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
        />
      </BlocFormLight>

      {readOnly ? (
        <ActionBar>
          <ButtonLink to="/recapitulatif" label="suivant" />
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
