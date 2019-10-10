/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Form } from "react-final-form";
import {
  FormState,
  ActionIndicateurDeuxTroisData,
  PeriodeDeclaration
} from "../../globals.d";

import { BlocFormLight } from "../../components/BlocForm";
import FieldInputsMenWomen from "../../components/FieldInputsMenWomen";
import RadiosBoolean from "../../components/RadiosBoolean";
import RadioButtons from "../../components/RadioButtons";
import ActionBar from "../../components/ActionBar";
import FormAutoSave from "../../components/FormAutoSave";
import FormSubmit from "../../components/FormSubmit";
import { ButtonSimulatorLink } from "../../components/SimulatorLink";

import {
  parseIntFormValue,
  parseIntStateValue,
  parseBooleanFormValue,
  parseBooleanStateValue,
  parsePeriodeDeclarationFormValue
} from "../../utils/formHelpers";

interface Props {
  presenceAugmentationPromotion: boolean;
  nombreAugmentationPromotionFemmes: number | undefined;
  nombreAugmentationPromotionHommes: number | undefined;
  periodeDeclaration: PeriodeDeclaration;
  readOnly: boolean;
  updateIndicateurDeuxTrois: (data: ActionIndicateurDeuxTroisData) => void;
  validateIndicateurDeuxTrois: (valid: FormState) => void;
}

function IndicateurDeuxTroisForm({
  presenceAugmentationPromotion,
  nombreAugmentationPromotionFemmes,
  nombreAugmentationPromotionHommes,
  periodeDeclaration,
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
    periodeDeclaration: periodeDeclaration
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
    const periodeDeclaration = parsePeriodeDeclarationFormValue(
      formData.periodeDeclaration
    );
    updateIndicateurDeuxTrois({
      presenceAugmentationPromotion,
      nombreAugmentationPromotionFemmes,
      nombreAugmentationPromotionHommes,
      periodeDeclaration
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
          <RadioButtons
            fieldName="periodeDeclaration"
            label="je déclare sur"
            value={values.periodeDeclaration}
            readOnly={readOnly}
            choices={[
              {
                label: "la dernière période de référence",
                value: "unePeriodeReference"
              },
              {
                label: "les deux dernières périodes de référence",
                value: "deuxPeriodesReference"
              },
              {
                label: "les trois dernières périodes de référence",
                value: "troisPeriodesReference"
              }
            ]}
          />

          <div css={styles.spacer} />

          {values.periodeDeclaration === "unePeriodeReference" && (
            <RadiosBoolean
              fieldName="presenceAugmentationPromotion"
              value={values.presenceAugmentationPromotion}
              readOnly={readOnly}
              labelTrue="il y a eu des augmentations ou des promotions durant la période de déclaration"
              labelFalse="il n’y a pas eu d'augmentations ou de promotions durant la période de déclaration"
            />
          )}

          {(values.presenceAugmentationPromotion === "true" ||
            values.periodeDeclaration !== "unePeriodeReference") && (
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
  }),
  spacer: css({
    marginTop: "2em"
  })
};

export default IndicateurDeuxTroisForm;
