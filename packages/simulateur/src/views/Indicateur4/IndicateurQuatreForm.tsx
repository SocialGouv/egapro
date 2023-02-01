import React, { FunctionComponent } from "react"
import { Form } from "react-final-form"

import {
  composeValidators,
  isFormValid,
  maxNumber,
  minNumber,
  mustBeInteger,
  mustBeNumber,
  parseBooleanFormValue,
  parseBooleanStateValue,
  parseIntFormValue,
  parseIntStateValue,
  required,
  ValidatorFunction,
} from "../../utils/formHelpers"

import ActionBar from "../../components/ActionBar"
import FormStack from "../../components/ds/FormStack"
import InputGroup from "../../components/ds/InputGroup"
import FormAutoSave from "../../components/FormAutoSave"
import FormError from "../../components/FormError"
import FormSubmit from "../../components/FormSubmit"
import RadiosBoolean from "../../components/RadiosBoolean"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"

const validator = composeValidators(required, mustBeNumber, mustBeInteger, minNumber(0))

const lessThanPreviousField: (previousField: string) => ValidatorFunction = (previousField) => (value) =>
  isNaN(Number(previousField))
    ? undefined
    : maxNumber(Number(previousField))(value)
    ? "ce champ ne peut être supérieur au précédent"
    : undefined

const IndicateurQuatreForm: FunctionComponent = () => {
  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const indicateurQuatre = state.indicateurQuatre

  const readOnly = isFormValid(state.indicateurQuatre)

  const initialValues = {
    presenceCongeMat: parseBooleanStateValue(indicateurQuatre.presenceCongeMat),
    nombreSalarieesPeriodeAugmentation: parseIntStateValue(indicateurQuatre.nombreSalarieesPeriodeAugmentation),
    nombreSalarieesAugmentees: parseIntStateValue(indicateurQuatre.nombreSalarieesAugmentees),
  }

  const saveForm = (formData: any) => {
    const { presenceCongeMat, nombreSalarieesPeriodeAugmentation, nombreSalarieesAugmentees } = formData

    dispatch({
      type: "updateIndicateurQuatre",
      data: {
        presenceCongeMat: parseBooleanFormValue(presenceCongeMat),
        nombreSalarieesPeriodeAugmentation: parseIntFormValue(nombreSalarieesPeriodeAugmentation),
        nombreSalarieesAugmentees: parseIntFormValue(nombreSalarieesAugmentees),
      },
    })
  }

  const onSubmit = (formData: any) => {
    saveForm(formData)
    dispatch({ type: "validateIndicateurQuatre", valid: "Valid" })
  }

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
              <FormError message="L’indicateur ne peut être calculé car tous les champs ne sont pas renseignés." />
            )}
            <RadiosBoolean
              fieldName="presenceCongeMat"
              value={values.presenceCongeMat}
              readOnly={readOnly}
              label={<>Y a-t-il eu des retours de congé maternité pendant la période de référence&nbsp;?</>}
            />

            {values.presenceCongeMat === "true" && (
              <>
                <InputGroup
                  fieldName="nombreSalarieesPeriodeAugmentation"
                  label="Parmi ces retours, combien étaient en congé maternité pendant qu'il y a eu une ou des augmentations salariales dans l'entreprise ?"
                  isReadOnly={readOnly}
                  validate={validator}
                />
                <InputGroup
                  fieldName="nombreSalarieesAugmentees"
                  label="Parmi ces salariées, combien ont bénéficié d’une augmentation à leur retour de congé maternité ?"
                  isReadOnly={readOnly}
                  validate={composeValidators(
                    validator,
                    lessThanPreviousField(values.nombreSalarieesPeriodeAugmentation),
                  )}
                />
              </>
            )}
          </FormStack>

          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/indicateur5" label="Suivant" />
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

export default IndicateurQuatreForm
