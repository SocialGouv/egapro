import React, { FunctionComponent } from "react"
import { Form } from "react-final-form"
import { FormControl, FormLabel, Stack } from "@chakra-ui/react"

import { FormState, ActionIndicateurDeuxTroisData, PeriodeDeclaration, GroupeEffectif } from "../../globals"

import {
  parseIntFormValue,
  parseIntStateValue,
  parseBooleanFormValue,
  parseBooleanStateValue,
  parsePeriodeDeclarationFormValue,
  ValidatorFunction,
  maxNumber,
  composeValidators,
  required,
  minNumber,
  mustBeInteger,
  mustBeNumber,
} from "../../utils/formHelpers"
import { calendarYear, dateToString, parseDate, Year } from "../../utils/helpers"
import totalNombreSalaries from "../../utils/totalNombreSalaries"

import BlocForm from "../../components/BlocForm"
import FieldInputsMenWomen from "../../components/FieldInputsMenWomen"
import RadiosBoolean from "../../components/RadiosBoolean"
import ActionBar from "../../components/ActionBar"
import FormAutoSave from "../../components/FormAutoSave"
import FormSubmit from "../../components/FormSubmit"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"
import FormError from "../../components/FormError"
import FormStack from "../../components/ds/FormStack"
import InputRadioGroup from "../../components/ds/InputRadioGroup"
import InputRadio from "../../components/ds/InputRadio"

const validator = composeValidators(required, mustBeNumber, mustBeInteger, minNumber(0))

interface IndicateurDeuxTroisForProps {
  finPeriodeReference: string
  presenceAugmentationPromotion: boolean
  nombreAugmentationPromotionFemmes: number | undefined
  nombreAugmentationPromotionHommes: number | undefined
  periodeDeclaration: PeriodeDeclaration
  nombreSalaries: GroupeEffectif[]
  readOnly: boolean
  updateIndicateurDeuxTrois: (data: ActionIndicateurDeuxTroisData) => void
  validateIndicateurDeuxTrois: (valid: FormState) => void
}

const IndicateurDeuxTroisForm: FunctionComponent<IndicateurDeuxTroisForProps> = ({
  finPeriodeReference,
  presenceAugmentationPromotion,
  nombreAugmentationPromotionFemmes,
  nombreAugmentationPromotionHommes,
  periodeDeclaration,
  nombreSalaries,
  readOnly,
  updateIndicateurDeuxTrois,
  validateIndicateurDeuxTrois,
}) => {
  const initialValues = {
    presenceAugmentationPromotion: parseBooleanStateValue(presenceAugmentationPromotion),
    nombreAugmentationPromotionFemmes: parseIntStateValue(nombreAugmentationPromotionFemmes),
    nombreAugmentationPromotionHommes: parseIntStateValue(nombreAugmentationPromotionHommes),
    periodeDeclaration: periodeDeclaration,
  }

  const saveForm = (formData: any) => {
    const presenceAugmentationPromotion = parseBooleanFormValue(formData.presenceAugmentationPromotion)
    const nombreAugmentationPromotionFemmes = parseIntFormValue(formData.nombreAugmentationPromotionFemmes)
    const nombreAugmentationPromotionHommes = parseIntFormValue(formData.nombreAugmentationPromotionHommes)
    const periodeDeclaration = parsePeriodeDeclarationFormValue(formData.periodeDeclaration)
    updateIndicateurDeuxTrois({
      presenceAugmentationPromotion,
      nombreAugmentationPromotionFemmes,
      nombreAugmentationPromotionHommes,
      periodeDeclaration,
    })
  }

  const onSubmit = (formData: any) => {
    saveForm(formData)
    validateIndicateurDeuxTrois("Valid")
  }

  const oneYear = dateToString(parseDate(calendarYear(finPeriodeReference, Year.Subtract, 1)))
  const twoYears = dateToString(parseDate(calendarYear(finPeriodeReference, Year.Subtract, 2)))
  const threeYears = dateToString(parseDate(calendarYear(finPeriodeReference, Year.Subtract, 3)))
  const dateFinPeriodeReference = dateToString(parseDate(finPeriodeReference))

  const { totalNombreSalariesHomme: totalNombreSalariesHommes, totalNombreSalariesFemme: totalNombreSalariesFemmes } =
    totalNombreSalaries(nombreSalaries)

  const validateEffectifs: (max: number, gender: string) => ValidatorFunction = (max, gender) => (value) =>
    maxNumber(max)(value) ? `Le nombre ${gender} ne peut pas être supérieur aux effectifs` : undefined

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
        <form onSubmit={handleSubmit}>
          <FormAutoSave saveForm={saveForm} />
          <FormStack>
            {submitFailed && hasValidationErrors && (
              <FormError message="L’indicateur ne peut pas être validé si tous les champs ne sont pas remplis." />
            )}
            <FormControl isReadOnly={readOnly}>
              <FormLabel as="div">Sur quelle période souhaitez-vous calculer votre indicateur&nbsp;?</FormLabel>
              {console.log("values.periodeDeclaration", values.periodeDeclaration)}
              <InputRadioGroup defaultValue={values.periodeDeclaration}>
                <Stack>
                  <InputRadio
                    value={values.periodeDeclaration}
                    fieldName="periodeDeclaration"
                    choiceValue="unePeriodeReference"
                    isReadOnly={readOnly}
                  >
                    Période de référence de l'index (du {oneYear} au {dateFinPeriodeReference})
                  </InputRadio>
                  <InputRadio
                    value={values.periodeDeclaration}
                    fieldName="periodeDeclaration"
                    choiceValue="deuxPeriodesReference"
                    isReadOnly={readOnly}
                  >
                    Période de référence de 2 ans (du {twoYears} au
                    {dateFinPeriodeReference})
                  </InputRadio>
                  <InputRadio
                    value={values.periodeDeclaration}
                    fieldName="periodeDeclaration"
                    choiceValue="troisPeriodesReference"
                    isReadOnly={readOnly}
                  >
                    Période de référence de 3 ans (du ${threeYears} au {dateFinPeriodeReference})
                  </InputRadio>
                </Stack>
              </InputRadioGroup>
            </FormControl>
            <RadiosBoolean
              fieldName="presenceAugmentationPromotion"
              value={values.presenceAugmentationPromotion}
              readOnly={readOnly}
              label={<>Il y a t'il eu des augmentations durant la période de déclaration&nbsp;?</>}
            />

            {values.presenceAugmentationPromotion === "true" && (
              <BlocForm title="Nombre d'augmentations">
                <FieldInputsMenWomen
                  legend="Nombre de"
                  title="salariés augmentés"
                  label={{
                    women: "Nombre de femmes augmentées",
                    men: "Nombre d'hommes'augmentées",
                  }}
                  readOnly={readOnly}
                  calculable={true} // This isn't used here, if the field is not calculable it's because of the number of men/women declared in the "effectifs"
                  calculableNumber={0} // Same here.
                  mask="number"
                  femmeFieldName="nombreAugmentationPromotionFemmes"
                  hommeFieldName="nombreAugmentationPromotionHommes"
                  validatorFemmes={composeValidators(
                    validator,
                    validateEffectifs(totalNombreSalariesFemmes, "de femmes"),
                  )}
                  validatorHommes={composeValidators(
                    validator,
                    validateEffectifs(totalNombreSalariesHommes, "d'hommes"),
                  )}
                />
              </BlocForm>
            )}
          </FormStack>

          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/indicateur4" label="Suivant" />
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

export default IndicateurDeuxTroisForm
