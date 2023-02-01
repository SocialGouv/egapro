import createDecorator from "final-form-calculate"
import React, { FunctionComponent } from "react"
import { Form } from "react-final-form"

import {
  composeValidators,
  maxNumber,
  minNumber,
  mustBeInteger,
  mustBeNumber,
  parseIntFormValue,
  parseIntStateValue,
  required,
} from "../../utils/formHelpers"

import ActionBar from "../../components/ActionBar"
import FormStack from "../../components/ds/FormStack"
import InputGroup from "../../components/ds/InputGroup"
import FormAutoSave from "../../components/FormAutoSave"
import FormError from "../../components/FormError"
import FormSubmit from "../../components/FormSubmit"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"

const validator = composeValidators(required, mustBeNumber, mustBeInteger, minNumber(0), maxNumber(10))

const calculator = createDecorator({
  field: "nombreSalariesFemmes",
  updates: {
    nombreSalariesHommes: (femmesValue, { nombreSalariesHommes }: any) =>
      validator(femmesValue) === undefined
        ? parseIntStateValue(10 - parseIntFormValue(femmesValue))
        : nombreSalariesHommes,
  },
})

const IndicateurCinqForm: FunctionComponent = () => {
  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const readOnly = state.indicateurCinq.formValidated === "Valid"

  const indicateurCinq = state.indicateurCinq

  const initialValues = {
    nombreSalariesHommes: parseIntStateValue(indicateurCinq.nombreSalariesHommes),
    nombreSalariesFemmes: parseIntStateValue(indicateurCinq.nombreSalariesFemmes),
  }

  const saveForm = (formData: any) => {
    const { nombreSalariesHommes, nombreSalariesFemmes } = formData

    dispatch({
      type: "updateIndicateurCinq",
      data: {
        nombreSalariesHommes: parseIntFormValue(nombreSalariesHommes),
        nombreSalariesFemmes: parseIntFormValue(nombreSalariesFemmes),
      },
    })
  }

  const onSubmit = (formData: any) => {
    saveForm(formData)
    dispatch({ type: "validateIndicateurCinq", valid: "Valid" })
  }

  return (
    <Form
      onSubmit={onSubmit}
      decorators={[calculator]}
      initialValues={initialValues}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ handleSubmit, hasValidationErrors, submitFailed }) => (
        <form onSubmit={handleSubmit}>
          <FormAutoSave saveForm={saveForm} />
          {/* eslint-disable-next-line react/jsx-no-undef */}
          <FormStack>
            {submitFailed && hasValidationErrors && (
              <FormError message="L’indicateur ne peut être calculé car tous les champs ne sont pas renseignés." />
            )}
            <InputGroup
              fieldName="nombreSalariesFemmes"
              label="Nombre (entier) de femmes parmi les 10 plus hauts salaires"
              isReadOnly={readOnly}
              validate={validator}
            />
            <InputGroup
              fieldName="nombreSalariesHommes"
              label="Nombre (entier) d'hommes parmi les 10 plus hauts salaires"
              isReadOnly
              validate={validator}
            />
          </FormStack>

          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/recapitulatif" label="Suivant" />
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

export default IndicateurCinqForm
