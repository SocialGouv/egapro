import React, { FunctionComponent } from "react"
import { Form } from "react-final-form"

import { FormState, ActionIndicateurDeuxData } from "../../globals"

import { effectifEtEcartAugmentGroup } from "../../utils/calculsEgaProIndicateurDeux"

import BlocForm from "../../components/BlocForm"
import FieldInputsMenWomen from "../../components/FieldInputsMenWomen"
import RadiosBoolean from "../../components/RadiosBoolean"
import ActionBar from "../../components/ActionBar"
import FormAutoSave from "../../components/FormAutoSave"
import FormSubmit from "../../components/FormSubmit"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"

import {
  parseFloatFormValue,
  parseFloatStateValue,
  parseBooleanFormValue,
  parseBooleanStateValue,
  composeValidators,
  minNumber,
  mustBeNumber,
  required,
} from "../../utils/formHelpers"
import {
  displayNameCategorieSocioPro,
  // displayFractionPercent
} from "../../utils/helpers"
import FormError from "../../components/FormError"
import FormStack from "../../components/ds/FormStack"

const validator = composeValidators(required, mustBeNumber, minNumber(0))

const validateForm = ({
  tauxAugmentation,
  presenceAugmentation,
}: {
  tauxAugmentation: Array<{
    validiteGroupe: boolean
    tauxAugmentationFemmes: string
    tauxAugmentationHommes: string
  }>
  presenceAugmentation: string
}) => {
  if (presenceAugmentation === "false") {
    return undefined
  }

  const allInputs = tauxAugmentation
    .filter((product) => product.validiteGroupe)
    .flatMap(({ tauxAugmentationFemmes, tauxAugmentationHommes }) => [tauxAugmentationFemmes, tauxAugmentationHommes])

  if (allInputs.every((input) => input === "0")) {
    return {
      notAll0: "Tous les champs ne peuvent pas être à 0 s'il y a eu des augmentations.",
    }
  }

  if (allInputs.every((input) => input === "")) {
    return {
      notAll0: "L’indicateur ne peut être calculé car tous les champs ne sont pas renseignés.",
    }
  }

  return
}

interface IndicateurDeuxFormProps {
  ecartAugmentParCategorieSocioPro: Array<effectifEtEcartAugmentGroup>
  presenceAugmentation: boolean
  readOnly: boolean
  updateIndicateurDeux: (data: ActionIndicateurDeuxData) => void
  validateIndicateurDeux: (valid: FormState) => void
}

const IndicateurDeuxForm: FunctionComponent<IndicateurDeuxFormProps> = ({
  ecartAugmentParCategorieSocioPro,
  presenceAugmentation,
  readOnly,
  updateIndicateurDeux,
  validateIndicateurDeux,
}) => {
  const initialValues = {
    presenceAugmentation: parseBooleanStateValue(presenceAugmentation),
    tauxAugmentation: ecartAugmentParCategorieSocioPro.map(
      ({ tauxAugmentationFemmes, tauxAugmentationHommes, ...otherProps }: any) => ({
        ...otherProps,
        tauxAugmentationFemmes: parseFloatStateValue(tauxAugmentationFemmes),
        tauxAugmentationHommes: parseFloatStateValue(tauxAugmentationHommes),
      }),
    ),
  }

  const saveForm = (formData: any) => {
    const presenceAugmentation = parseBooleanFormValue(formData.presenceAugmentation)
    const tauxAugmentation = formData.tauxAugmentation.map(
      ({ categorieSocioPro, tauxAugmentationFemmes, tauxAugmentationHommes }: any) => ({
        categorieSocioPro,
        tauxAugmentationFemmes: parseFloatFormValue(tauxAugmentationFemmes),
        tauxAugmentationHommes: parseFloatFormValue(tauxAugmentationHommes),
      }),
    )
    updateIndicateurDeux({
      tauxAugmentation,
      presenceAugmentation,
    })
  }

  const onSubmit = (formData: any) => {
    saveForm(formData)
    validateIndicateurDeux("Valid")
  }

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
      validate={validateForm}
      initialValues={initialValues}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ handleSubmit, values, hasValidationErrors, errors, submitFailed }) => (
        <form onSubmit={handleSubmit}>
          <FormAutoSave saveForm={saveForm} />
          <FormStack>
            {submitFailed && hasValidationErrors && (
              <FormError
                message={
                  errors?.notAll0
                    ? errors.notAll0
                    : "L’indicateur ne peut être calculé car tous les champs ne sont pas renseignés."
                }
              />
            )}
            <RadiosBoolean
              fieldName="presenceAugmentation"
              value={values.presenceAugmentation}
              readOnly={readOnly}
              label={
                <>Y a-t-il eu des augmentations individuelles (hors promotions) durant la période de référence&nbsp;?</>
              }
            />

            {values.presenceAugmentation === "true" && (
              <BlocForm
                title="Pourcentage d'augmentations"
                // footer={[
                //   displayFractionPercent(totalTauxAugmentationFemmes),
                //   displayFractionPercent(totalTauxAugmentationHommes)
                // ]}
              >
                {ecartAugmentParCategorieSocioPro.map(({ categorieSocioPro, validiteGroupe }, index) => {
                  return (
                    <FieldInputsMenWomen
                      key={categorieSocioPro}
                      legend="% de salariés augmentés"
                      label={{
                        women: `Pourcentage de femmes ${displayNameCategorieSocioPro(categorieSocioPro)} augmentées`,
                        men: `Pourcentage d'hommes' ${displayNameCategorieSocioPro(categorieSocioPro)} augmentés`,
                      }}
                      title={displayNameCategorieSocioPro(categorieSocioPro)}
                      readOnly={readOnly}
                      calculable={validiteGroupe}
                      calculableNumber={10}
                      mask="percent"
                      femmeFieldName={`tauxAugmentation.${index}.tauxAugmentationFemmes`}
                      hommeFieldName={`tauxAugmentation.${index}.tauxAugmentationHommes`}
                      validatorFemmes={validator}
                      validatorHommes={validator}
                    />
                  )
                })}
              </BlocForm>
            )}
          </FormStack>

          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/indicateur3" label="Suivant" />
            </ActionBar>
          ) : (
            <ActionBar>
              <FormSubmit />
            </ActionBar>
          )}
        </form>
      )}
    </Form>
  )
}

export default IndicateurDeuxForm
