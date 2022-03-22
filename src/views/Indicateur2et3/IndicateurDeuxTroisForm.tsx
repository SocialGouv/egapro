/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"
import { Form } from "react-final-form"
import { FormState, ActionIndicateurDeuxTroisData, PeriodeDeclaration, GroupeEffectif } from "../../globals"

import BlocForm from "../../components/BlocForm"
import FieldInputsMenWomen from "../../components/FieldInputsMenWomen"
import RadiosBoolean from "../../components/RadiosBoolean"
import RadioButtons from "../../components/RadioButtons"
import ActionBar from "../../components/ActionBar"
import FormAutoSave from "../../components/FormAutoSave"
import FormSubmit from "../../components/FormSubmit"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"

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

const validator = composeValidators(required, mustBeNumber, mustBeInteger, minNumber(0))
interface Props {
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

function IndicateurDeuxTroisForm({
  finPeriodeReference,
  presenceAugmentationPromotion,
  nombreAugmentationPromotionFemmes,
  nombreAugmentationPromotionHommes,
  periodeDeclaration,
  nombreSalaries,
  readOnly,
  updateIndicateurDeuxTrois,
  validateIndicateurDeuxTrois,
}: Props) {
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
        <form onSubmit={handleSubmit} css={styles.container}>
          <FormAutoSave saveForm={saveForm} />
          <RadioButtons
            fieldName="periodeDeclaration"
            label="Sur quelle période souhaitez-vous calculer votre indicateur ?"
            value={values.periodeDeclaration}
            readOnly={readOnly}
            choices={[
              {
                label: `Période de référence de l'index (du ${oneYear} au ${dateFinPeriodeReference})`,
                value: "unePeriodeReference",
              },
              {
                label: `Période de référence de 2 ans (du ${twoYears} au ${dateFinPeriodeReference})`,
                value: "deuxPeriodesReference",
              },
              {
                label: `Période de référence de 3 ans (du ${threeYears} au ${dateFinPeriodeReference})`,
                value: "troisPeriodesReference",
              },
            ]}
          />

          <div css={styles.spacer} />

          <RadiosBoolean
            fieldName="presenceAugmentationPromotion"
            value={values.presenceAugmentationPromotion}
            readOnly={readOnly}
            labelTrue="il y a eu des augmentations durant la période de déclaration"
            labelFalse="il n’y a pas eu d'augmentations durant la période de déclaration"
          />

          {values.presenceAugmentationPromotion === "true" && (
            <BlocForm>
              <FieldInputsMenWomen
                name="nombre de salariés augmentés"
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
                validatorHommes={composeValidators(validator, validateEffectifs(totalNombreSalariesHommes, "d'hommes"))}
              />
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
  )
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
  }),
  spacer: css({
    marginTop: "2em",
  }),
}

export default IndicateurDeuxTroisForm
