/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { memo } from "react";
import { useForm } from "react-final-form-hooks";
import { AppState, FormState, ActionIndicateurQuatreData } from "../globals.d";

import { BlocFormLight } from "../components/BlocForm";
import FieldInput from "../components/FieldInput";
import RadiosBoolean from "../components/RadiosBoolean";
import ActionBar from "../components/ActionBar";
import FormSubmit from "../components/FormSubmit";
import ButtonLink from "../components/ButtonLink";

interface Props {
  indicateurQuatre: AppState["indicateurQuatre"];
  readOnly: boolean;
  updateIndicateurQuatre: (data: ActionIndicateurQuatreData) => void;
  validateIndicateurQuatre: (valid: FormState) => void;
}

const parseFormValue = (value: string, defaultValue: any = undefined) =>
  value === ""
    ? defaultValue
    : Number.isNaN(Number(value))
    ? defaultValue
    : parseInt(value, 10);

const parseStateValue = (value: number | undefined) =>
  value === undefined ? "" : String(value);

function IndicateurQuatreForm({
  indicateurQuatre,
  readOnly,
  updateIndicateurQuatre,
  validateIndicateurQuatre
}: Props) {
  const initialValues = {
    presenceAugmentation: String(indicateurQuatre.presenceAugmentation),
    nombreSalariees: parseStateValue(indicateurQuatre.nombreSalariees),
    nombreSalarieesPeriodeAugmentation: parseStateValue(
      indicateurQuatre.nombreSalarieesPeriodeAugmentation
    ),
    nombreSalarieesAugmentees: parseStateValue(
      indicateurQuatre.nombreSalarieesAugmentees
    )
  };

  const saveForm = (formData: any) => {
    const {
      presenceAugmentation,
      nombreSalariees,
      nombreSalarieesPeriodeAugmentation,
      nombreSalarieesAugmentees
    } = formData;

    updateIndicateurQuatre({
      presenceAugmentation: presenceAugmentation === "true",
      nombreSalariees: parseFormValue(nombreSalariees),
      nombreSalarieesPeriodeAugmentation: parseFormValue(
        nombreSalarieesPeriodeAugmentation
      ),
      nombreSalarieesAugmentees: parseFormValue(nombreSalarieesAugmentees)
    });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateIndicateurQuatre("Valid");
  };

  const {
    form,
    values,
    handleSubmit,
    hasValidationErrors,
    submitFailed
  } = useForm({
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
      <RadiosBoolean
        form={form}
        fieldName="presenceAugmentation"
        readOnly={readOnly}
        labelTrue="il y a eu des augmentations collective ou individuelle durant la période de référence"
        labelFalse="il n’y a pas eu d’augmentation collective ou individuelle durant la période de référence"
      />

      {values.presenceAugmentation === "true" && (
        <BlocFormLight>
          <FieldInput
            form={form}
            fieldName="nombreSalariees"
            label="nombre de salariées de retour de congé maternité"
            readOnly={readOnly}
          />
          <FieldInput
            form={form}
            fieldName="nombreSalarieesPeriodeAugmentation"
            label="parmis ces congès maternité, combien ont chevauchée une periode d’augmentation"
            readOnly={readOnly}
          />
          <FieldInput
            form={form}
            fieldName="nombreSalarieesAugmentees"
            label="parmis ces congès maternité ayant chevauchée une periode d’augmentation, combien ont été augmentées ?"
            readOnly={readOnly}
          />
        </BlocFormLight>
      )}

      {readOnly ? (
        <ActionBar>
          <ButtonLink to="/indicateur5" label="suivant" />
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
  IndicateurQuatreForm,
  (prevProps, nextProps) => prevProps.readOnly === nextProps.readOnly
);
