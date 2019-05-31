/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { memo, Fragment } from "react";
import { useForm } from "react-final-form-hooks";
import { AppState, FormState, ActionIndicateurQuatreData } from "../globals.d";

import { parseIntFormValue, parseIntStateValue } from "../utils/formParse";

import { BlocFormLight } from "../components/BlocForm";
import FieldInput, {
  HEIGHT as FieldInputHeight,
  MARGIN_TOP as FieldInputMarginTop
} from "../components/FieldInput";
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

function IndicateurQuatreForm({
  indicateurQuatre,
  readOnly,
  updateIndicateurQuatre,
  validateIndicateurQuatre
}: Props) {
  const initialValues = {
    presenceAugmentation: String(indicateurQuatre.presenceAugmentation),
    presenceCongeMat: String(indicateurQuatre.presenceCongeMat),
    nombreSalarieesPeriodeAugmentation: parseIntStateValue(
      indicateurQuatre.nombreSalarieesPeriodeAugmentation
    ),
    nombreSalarieesAugmentees: parseIntStateValue(
      indicateurQuatre.nombreSalarieesAugmentees
    )
  };

  const saveForm = (formData: any) => {
    const {
      presenceAugmentation,
      presenceCongeMat,
      nombreSalarieesPeriodeAugmentation,
      nombreSalarieesAugmentees
    } = formData;

    updateIndicateurQuatre({
      presenceAugmentation: presenceAugmentation === "true",
      presenceCongeMat: presenceCongeMat === "true",
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
          <RadiosBoolean
            form={form}
            fieldName="presenceCongeMat"
            readOnly={readOnly}
            labelTrue="il y a eu des retours de congé maternité pendant la période de référence"
            labelFalse="il n’y a pas eu de retour de congé maternité pendant la période de référence"
          />
          <div css={styles.spacer} />
          {values.presenceCongeMat === "true" ? (
            <Fragment>
              <FieldInput
                form={form}
                fieldName="nombreSalarieesPeriodeAugmentation"
                label="pour combien de salariées, ces congés maternités ont eu lieu pendant des périodes d’augmentation"
                readOnly={readOnly}
              />
              <FieldInput
                form={form}
                fieldName="nombreSalarieesAugmentees"
                label="parmi ces salariées combien ont été augmentées à leur retour"
                readOnly={readOnly}
              />
            </Fragment>
          ) : (
            <div css={styles.emptyFields} />
          )}
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
  }),
  spacer: css({
    height: 24
  }),
  emptyFields: css({
    height: (FieldInputHeight + FieldInputMarginTop) * 2
  })
};

export default memo(
  IndicateurQuatreForm,
  (prevProps, nextProps) => prevProps.readOnly === nextProps.readOnly
);
