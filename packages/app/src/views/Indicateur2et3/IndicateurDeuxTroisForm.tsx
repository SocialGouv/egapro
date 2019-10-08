/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Field, Form } from "react-final-form";
import { FormState, ActionIndicateurDeuxTroisData } from "../../globals.d";

// import {
//   // calculTotalEffectifsEtTauxAugmentationPromotion,
//   // calculEcartTauxAugmentationPromotion,
//   effectifEtEcartAugmentationPromotionGroup
// } from "../../utils/calculsEgaProIndicateurDeuxTrois";

import { BlocFormLight } from "../../components/BlocForm";
import FieldInputsMenWomen from "../../components/FieldInputsMenWomen";
import RadiosBoolean from "../../components/RadiosBoolean";
import ActionBar from "../../components/ActionBar";
import FormAutoSave from "../../components/FormAutoSave";
import FormSubmit from "../../components/FormSubmit";
import { ButtonSimulatorLink } from "../../components/SimulatorLink";

import {
  parseIntFormValue,
  parseIntStateValue,
  parseBooleanFormValue,
  parseBooleanStateValue
} from "../../utils/formHelpers";
// import {
//   displayNameCategorieSocioPro
//   // displayFractionPercent
// } from "../../utils/helpers";

interface Props {
  presenceAugmentationPromotion: boolean;
  nombreAugmentationPromotionFemmes: number | undefined;
  nombreAugmentationPromotionHommes: number | undefined;
  memePeriodeReference: boolean;
  periodeReferenceDebut: string;
  periodeReferenceFin: string;
  readOnly: boolean;
  updateIndicateurDeuxTrois: (data: ActionIndicateurDeuxTroisData) => void;
  validateIndicateurDeuxTrois: (valid: FormState) => void;
}

function IndicateurDeuxTroisForm({
  presenceAugmentationPromotion,
  nombreAugmentationPromotionFemmes,
  nombreAugmentationPromotionHommes,
  memePeriodeReference,
  periodeReferenceDebut,
  periodeReferenceFin,
  readOnly,
  updateIndicateurDeuxTrois,
  validateIndicateurDeuxTrois
}: Props) {
  const initialValues = {
    presenceAugmentationPromotion: parseBooleanStateValue(
      presenceAugmentationPromotion
    ),
    nombreAugmentationPromotionFemmes: parseIntStateValue(
      nombreAugmentationPromotionFemmes
    ),
    nombreAugmentationPromotionHommes: parseIntStateValue(
      nombreAugmentationPromotionHommes
    ),
    memePeriodeReference: parseBooleanStateValue(memePeriodeReference),
    periodeReferenceDebut: periodeReferenceDebut,
    periodeReferenceFin: periodeReferenceFin
  };

  const saveForm = (formData: any) => {
    const presenceAugmentationPromotion = parseBooleanFormValue(
      formData.presenceAugmentationPromotion
    );
    const nombreAugmentationPromotionFemmes = parseIntFormValue(
      formData.nombreAugmentationPromotionFemmes
    );
    const nombreAugmentationPromotionHommes = parseIntFormValue(
      formData.nombreAugmentationPromotionHommes
    );
    const memePeriodeReference = parseBooleanFormValue(
      formData.memePeriodeReference
    );
    updateIndicateurDeuxTrois({
      presenceAugmentationPromotion,
      nombreAugmentationPromotionFemmes,
      nombreAugmentationPromotionHommes,
      memePeriodeReference,
      periodeReferenceDebut: formData.periodeReferenceDebut,
      periodeReferenceFin: formData.periodeReferenceFin
    });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateIndicateurDeuxTrois("Valid");
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
      {({ handleSubmit, values, hasValidationErrors, submitFailed }) => (
        <form onSubmit={handleSubmit} css={styles.container}>
          <FormAutoSave saveForm={saveForm} />
          <RadiosBoolean
            fieldName="memePeriodeReference"
            value={values.memePeriodeReference}
            readOnly={readOnly}
            labelTrue="je déclare sur la période de référence allant du XX/XX/XX au XX/XX/XX"
            labelFalse="je souhaite déclarer sur une autre période de référence"
          />

          {values.memePeriodeReference === "false" && (
            <div>
              <Field
                name="periodeReferenceDebut"
                label="Date de début"
                readOnly={readOnly}
                render={props => {
                  return <input {...props.input} type="date" />;
                }}
              />
              <Field
                name="periodeReferenceFin"
                label="Date de fin"
                readOnly={readOnly}
                render={props => {
                  return <input {...props.input} type="date" />;
                }}
              />
            </div>
          )}

          <RadiosBoolean
            fieldName="presenceAugmentationPromotion"
            value={values.presenceAugmentationPromotion}
            readOnly={readOnly}
            labelTrue="il y a eu des augmentations ou des promotions durant la période de référence"
            labelFalse="il n’y a pas eu d'augmentations ou de promotions durant la période de référence"
          />

          {values.presenceAugmentationPromotion === "true" && (
            <BlocFormLight>
              <FieldInputsMenWomen
                name="nombre de salariés augmentés ou promus"
                readOnly={readOnly}
                calculable={true} // TODO: the total number of women and men must be above 5.
                calculableNumber={5} // TODO: this calculable number applies to the "effectif" entered in the first step
                mask="number"
                femmeFieldName="nombreAugmentationPromotionFemmes"
                hommeFieldName="nombreAugmentationPromotionHommes"
              />
            </BlocFormLight>
          )}

          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/indicateur4" label="suivant" />
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

export default IndicateurDeuxTroisForm;
