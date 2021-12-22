import React, { FunctionComponent } from "react"
import { Form, useField } from "react-final-form"
import { FormControl, FormLabel, FormErrorMessage } from "@chakra-ui/react"

import { AppState, FormState, ActionInformationsSimulationData } from "../../globals"

import {
  mustBeNumber,
  parseIntFormValue,
  parseIntStateValue,
  parseTrancheEffectifsFormValue,
  required,
} from "../../utils/formHelpers"
import { parseDate } from "../../utils/helpers"

import ActionBar from "../../components/ActionBar"
import AnneeDeclaration from "../../components/AnneeDeclaration"
import FieldDate from "../../components/FieldDate"
import FormAutoSave from "../../components/FormAutoSave"
import FormSubmit from "../../components/FormSubmit"
import Input, { hasFieldError } from "../../components/Input"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"
import ButtonAction from "../../components/ButtonAction"
import FormStack from "../../components/ds/FormStack"
import { IconEdit } from "../../components/ds/Icons"
import InputRadioGroup from "../../components/ds/InputRadioGroup"
import InputRadio from "../../components/ds/InputRadio"

const validate = (value: string) => {
  const requiredError = required(value)
  if (!requiredError) {
    return undefined
  } else {
    return {
      required: requiredError,
    }
  }
}

const validateInt = (value: string) => {
  const requiredError = required(value)
  const mustBeNumberError = mustBeNumber(value)
  if (!requiredError && !mustBeNumberError) {
    return undefined
  } else {
    return { required: requiredError, mustBeNumber: mustBeNumberError }
  }
}

const validateForm = ({
  nomEntreprise,
  anneeDeclaration,
  finPeriodeReference,
}: {
  nomEntreprise: string
  anneeDeclaration: string
  finPeriodeReference: string
}) => {
  const parsedFinPeriodeReference = parseDate(finPeriodeReference)
  return {
    nomEntreprise: validate(nomEntreprise),
    anneeDeclaration: validateInt(anneeDeclaration),
    finPeriodeReference:
      parsedFinPeriodeReference !== undefined && parsedFinPeriodeReference.getFullYear().toString() === anneeDeclaration
        ? undefined
        : {
            correspondanceAnneeDeclaration:
              "L'année de fin de période de référence doit correspondre à l'année au titre de laquelle les indicateurs sont calculés",
          },
  }
}

const FieldNomEntreprise = ({ readOnly }: { readOnly: boolean }) => {
  const field = useField("nomEntreprise", { validate })
  const error = hasFieldError(field.meta)

  return (
    <FormControl isInvalid={error}>
      <FormLabel htmlFor={field.input.name}>Nom de la simulation (ex : nom_entreprise_date)</FormLabel>
      <Input field={field} isReadOnly={readOnly} />
      <FormErrorMessage>Le nom n’est pas valide</FormErrorMessage>
    </FormControl>
  )
}

const FieldPeriodeReference = ({ readOnly, onClick }: { readOnly: boolean; onClick: () => void }) => (
  <FieldDate
    name="finPeriodeReference"
    readOnly={readOnly}
    label="Date de fin de la période de référence choisie pour le calcul de votre Index (jj/mm/aaaa)"
  >
    <ButtonAction
      ml={2}
      label="sélectionner la fin de l'année civile"
      onClick={onClick}
      disabled={readOnly}
      size="sm"
      variant="ghost"
    />
  </FieldDate>
)

interface InformationsSimulationFormProps {
  informations: AppState["informations"]
  readOnly: boolean
  updateInformationsSimulation: (data: ActionInformationsSimulationData) => void
  validateInformationsSimulation: (valid: FormState) => void
}

const InformationsSimulationForm: FunctionComponent<InformationsSimulationFormProps> = ({
  informations,
  readOnly,
  updateInformationsSimulation,
  validateInformationsSimulation,
}) => {
  const initialValues = {
    nomEntreprise: informations.nomEntreprise,
    trancheEffectifs: informations.trancheEffectifs,
    anneeDeclaration: parseIntStateValue(informations.anneeDeclaration),
    finPeriodeReference: informations.finPeriodeReference,
  }

  const saveForm = (formData: any) => {
    const { nomEntreprise, trancheEffectifs, anneeDeclaration, finPeriodeReference } = formData

    updateInformationsSimulation({
      nomEntreprise,
      trancheEffectifs: parseTrancheEffectifsFormValue(trancheEffectifs),
      anneeDeclaration: parseIntFormValue(anneeDeclaration),
      finPeriodeReference,
    })
  }

  const onSubmit = (formData: any) => {
    saveForm(formData)
    validateInformationsSimulation("Valid")
  }

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={initialValues}
      validate={validateForm}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
      mutators={{
        selectEndOfYear: (args, state, utils) => {
          const anneeDeclaration = parseIntFormValue((state.formState.values as any).anneeDeclaration)
          if (!anneeDeclaration) return
          utils.changeValue(state, "finPeriodeReference", () => `31/12/${anneeDeclaration}`)
        },
      }}
    >
      {({ form, handleSubmit, hasValidationErrors, submitFailed, values }) => (
        <form onSubmit={handleSubmit}>
          <FormStack>
            {/* pass `onlyWhenDirty={false}` because we want the form to always
          auto save, as we update the left menu depending on the "tranche
          d'effectifs". Otherwise it would not re-update the menu when
          switching back to the original value */}
            <FormAutoSave saveForm={saveForm} onlyWhenDirty={false} />
            <FieldNomEntreprise readOnly={readOnly} />

            <FormControl readOnly={readOnly}>
              <FormLabel as="div">
                Tranche d'effectifs assujettis de l'entreprise ou de l'unité économique et sociale (UES)
              </FormLabel>
              <InputRadioGroup defaultValue={values.trancheEffectifs}>
                <InputRadio
                  value="50 à 250"
                  fieldName="trancheEffectifs"
                  choiceValue={"50 à 250"}
                  isReadOnly={readOnly}
                >
                  Entre 50 et 250
                </InputRadio>
                <InputRadio
                  value="251 à 999"
                  fieldName="trancheEffectifs"
                  choiceValue={"251 à 999"}
                  isReadOnly={readOnly}
                >
                  Entre 251 et 999
                </InputRadio>
                <InputRadio
                  value="1000 et plus"
                  fieldName="trancheEffectifs"
                  choiceValue="1000 et plus"
                  isReadOnly={readOnly}
                >
                  1000 et plus
                </InputRadio>
              </InputRadioGroup>
            </FormControl>

            <AnneeDeclaration
              label="Année au titre de laquelle les indicateurs sont calculés"
              name="anneeDeclaration"
              readOnly={readOnly}
            />

            <FieldPeriodeReference
              readOnly={readOnly || !parseIntFormValue(values.anneeDeclaration)}
              onClick={form.mutators.selectEndOfYear}
            />
          </FormStack>
          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/effectifs" label="Suivant" />
              {informations.formValidated === "Valid" && (
                <ButtonAction
                  leftIcon={<IconEdit />}
                  label="Modifier les données saisies"
                  onClick={() => validateInformationsSimulation("None")}
                  variant="link"
                  size="sm"
                />
              )}
            </ActionBar>
          ) : (
            <ActionBar>
              <FormSubmit
                hasValidationErrors={hasValidationErrors}
                submitFailed={submitFailed}
                errorMessage="Le formulaire ne peut pas être validé si tous les champs ne sont pas remplis."
              />
            </ActionBar>
          )}
        </form>
      )}
    </Form>
  )
}

export default InformationsSimulationForm
