/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Form } from "react-final-form";
import { FormState, ActionIndicateurDeuxData } from "../../globals";

import {
  // calculTotalEffectifsEtTauxAugmentation,
  // calculEcartTauxAugmentation,
  effectifEtEcartAugmentGroup
} from "../../utils/calculsEgaProIndicateurDeux";

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
  ecartAugmentParCategorieSocioPro: Array<effectifEtEcartAugmentGroup>;
  presenceAugmentation: boolean;
  readOnly: boolean;
  updateIndicateurDeux: (data: ActionIndicateurDeuxData) => void;
  validateIndicateurDeux: (valid: FormState) => void;
}

function IndicateurDeuxForm({
  ecartAugmentParCategorieSocioPro,
  presenceAugmentation,
  readOnly,
  updateIndicateurDeux,
  validateIndicateurDeux
}: Props) {
  const initialValues = {
    presenceAugmentation: parseBooleanStateValue(presenceAugmentation),
    tauxAugmentation: ecartAugmentParCategorieSocioPro.map(
      ({
        tauxAugmentationFemmes,
        tauxAugmentationHommes,
        ...otherProps
      }: any) => ({
        ...otherProps,
        tauxAugmentationFemmes: parseFloatStateValue(tauxAugmentationFemmes),
        tauxAugmentationHommes: parseFloatStateValue(tauxAugmentationHommes)
      })
    )
  };

  const saveForm = (formData: any) => {
    const presenceAugmentation = parseBooleanFormValue(
      formData.presenceAugmentation
    );
    const tauxAugmentation = formData.tauxAugmentation.map(
      ({
        categorieSocioPro,
        tauxAugmentationFemmes,
        tauxAugmentationHommes
      }: any) => ({
        categorieSocioPro,
        tauxAugmentationFemmes: parseFloatFormValue(tauxAugmentationFemmes),
        tauxAugmentationHommes: parseFloatFormValue(tauxAugmentationHommes)
      })
    );
    updateIndicateurDeux({
      tauxAugmentation,
      presenceAugmentation
    });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateIndicateurDeux("Valid");
  };

  // Only for Total with updated values
  // const ecartAugmentParCategorieSocioProPourTotal = ecartAugmentParCategorieSocioPro.map(
  //   (groupAugment, index) => {
  //     const infoField = infoFields[index];
  //     const tauxAugmentationFemmes = parseFloatFormValue(
  //       values[infoField.tauxAugmentationFemmesName]
  //     );
  //     const tauxAugmentationHommes = parseFloatFormValue(
  //       values[infoField.tauxAugmentationHommesName]
  //     );
  //     const ecartTauxAugmentation = calculEcartTauxAugmentation(
  //       tauxAugmentationFemmes,
  //       tauxAugmentationHommes
  //     );
  //     return {
  //       ...groupAugment,
  //       tauxAugmentationFemmes,
  //       tauxAugmentationHommes,
  //       ecartTauxAugmentation
  //     };
  //   }
  // );
  // const {
  //   totalTauxAugmentationFemmes,
  //   totalTauxAugmentationHommes
  // } = calculTotalEffectifsEtTauxAugmentation(
  //   ecartAugmentParCategorieSocioProPourTotal
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
            fieldName="presenceAugmentation"
            value={values.presenceAugmentation}
            readOnly={readOnly}
            labelTrue="il y a eu des augmentations durant la période de référence"
            labelFalse="il n’y a pas eu d’augmentation durant la période de référence"
          />

          {values.presenceAugmentation === "true" && (
            <BlocForm
              label="% de salariés augmentés"
              // footer={[
              //   displayFractionPercent(totalTauxAugmentationFemmes),
              //   displayFractionPercent(totalTauxAugmentationHommes)
              // ]}
            >
              {ecartAugmentParCategorieSocioPro.map(
                ({ categorieSocioPro, validiteGroupe }, index) => {
                  return (
                    <FieldInputsMenWomen
                      key={categorieSocioPro}
                      name={displayNameCategorieSocioPro(categorieSocioPro)}
                      readOnly={readOnly}
                      calculable={validiteGroupe}
                      calculableNumber={10}
                      mask="percent"
                      femmeFieldName={`tauxAugmentation.${index}.tauxAugmentationFemmes`}
                      hommeFieldName={`tauxAugmentation.${index}.tauxAugmentationHommes`}
                    />
                  );
                }
              )}
            </BlocForm>
          )}

          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/indicateur3" label="suivant" />
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

export default IndicateurDeuxForm;
