/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Form } from "react-final-form";
import { FormState, ActionIndicateurDeuxTroisData } from "../../globals.d";

import {
  // calculTotalEffectifsEtTauxAugmentationPromotion,
  // calculEcartTauxAugmentationPromotion,
  effectifEtEcartAugmentationPromotionGroup
} from "../../utils/calculsEgaProIndicateurDeuxTrois";

import BlocForm from "../../components/BlocForm";
import FieldInputsMenWomen from "../../components/FieldInputsMenWomen";
import RadiosBoolean from "../../components/RadiosBoolean";
import ActionBar from "../../components/ActionBar";
import FormAutoSave from "../../components/FormAutoSave";
import FormSubmit from "../../components/FormSubmit";
import { ButtonSimulatorLink } from "../../components/SimulatorLink";

import {
  parseFloatFormValue,
  parseFloatStateValue,
  parseBooleanFormValue,
  parseBooleanStateValue
} from "../../utils/formHelpers";
import {
  displayNameCategorieSocioPro
  // displayFractionPercent
} from "../../utils/helpers";

interface Props {
  ecartPromoParCategorieSocioPro: Array<
    effectifEtEcartAugmentationPromotionGroup
  >;
  presenceAugmentationPromotion: boolean;
  readOnly: boolean;
  updateIndicateurDeuxTrois: (data: ActionIndicateurDeuxTroisData) => void;
  validateIndicateurDeuxTrois: (valid: FormState) => void;
}

function IndicateurDeuxTroisForm({
  ecartPromoParCategorieSocioPro,
  presenceAugmentationPromotion,
  readOnly,
  updateIndicateurDeuxTrois,
  validateIndicateurDeuxTrois
}: Props) {
  const initialValues = {
    presenceAugmentationPromotion: parseBooleanStateValue(
      presenceAugmentationPromotion
    ),
    tauxAugmentationPromotion: ecartPromoParCategorieSocioPro.map(
      ({
        tauxAugmentationPromotionFemmes,
        tauxAugmentationPromotionHommes,
        ...otherProps
      }: any) => ({
        ...otherProps,
        tauxAugmentationPromotionFemmes: parseFloatStateValue(
          tauxAugmentationPromotionFemmes
        ),
        tauxAugmentationPromotionHommes: parseFloatStateValue(
          tauxAugmentationPromotionHommes
        )
      })
    )
  };

  const saveForm = (formData: any) => {
    const presenceAugmentationPromotion = parseBooleanFormValue(
      formData.presenceAugmentationPromotion
    );
    const tauxAugmentationPromotion = formData.tauxAugmentationPromotion.map(
      ({
        categorieSocioPro,
        tauxAugmentationPromotionFemmes,
        tauxAugmentationPromotionHommes
      }: any) => ({
        categorieSocioPro,
        tauxAugmentationPromotionFemmes: parseFloatFormValue(
          tauxAugmentationPromotionFemmes
        ),
        tauxAugmentationPromotionHommes: parseFloatFormValue(
          tauxAugmentationPromotionHommes
        )
      })
    );
    updateIndicateurDeuxTrois({
      tauxAugmentationPromotion,
      presenceAugmentationPromotion
    });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateIndicateurDeuxTrois("Valid");
  };

  // Only for Total with updated values
  // const ecartPromoParCategorieSocioProPourTotal = ecartPromoParCategorieSocioPro.map(
  //   (groupAugment, index) => {
  //     const infoField = infoFields[index];
  //     const tauxAugmentationPromotionFemmes = parseFloatFormValue(
  //       values[infoField.tauxAugmentationPromotionFemmesName]
  //     );
  //     const tauxAugmentationPromotionHommes = parseFloatFormValue(
  //       values[infoField.tauxAugmentationPromotionHommesName]
  //     );
  //     const ecartTauxAugmentationPromotion = calculEcartTauxAugmentationPromotion(
  //       tauxAugmentationPromotionFemmes,
  //       tauxAugmentationPromotionHommes
  //     );
  //     return {
  //       ...groupAugment,
  //       tauxAugmentationPromotionFemmes,
  //       tauxAugmentationPromotionHommes,
  //       ecartTauxAugmentationPromotion
  //     };
  //   }
  // );
  // const {
  //   totalTauxAugmentationPromotionFemmes,
  //   totalTauxAugmentationPromotionHommes
  // } = calculTotalEffectifsEtTauxAugmentationPromotion(
  //   ecartPromoParCategorieSocioProPourTotal
  // );

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
            fieldName="presenceAugmentationPromotion"
            value={values.presenceAugmentationPromotion}
            readOnly={readOnly}
            labelTrue="il y a eu des augmentations ou des promotions durant la période de référence"
            labelFalse="il n’y a pas eu d'augmentations ou de promotions durant la période de référence"
          />

          {values.presenceAugmentationPromotion === "true" && (
            <BlocForm
              label="% de salariés augmentés ou promus"
              // footer={[
              //   displayFractionPercent(totalTauxAugmentationPromotionFemmes),
              //   displayFractionPercent(totalTauxAugmentationPromotionHommes)
              // ]}
            >
              {ecartPromoParCategorieSocioPro.map(
                ({ categorieSocioPro, validiteGroupe }, index) => {
                  return (
                    <FieldInputsMenWomen
                      key={categorieSocioPro}
                      name={displayNameCategorieSocioPro(categorieSocioPro)}
                      readOnly={readOnly}
                      calculable={validiteGroupe}
                      calculableNumber={10}
                      mask="percent"
                      femmeFieldName={`tauxAugmentationPromotion.${index}.tauxAugmentationPromotionFemmes`}
                      hommeFieldName={`tauxAugmentationPromotion.${index}.tauxAugmentationPromotionHommes`}
                    />
                  );
                }
              )}
            </BlocForm>
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
