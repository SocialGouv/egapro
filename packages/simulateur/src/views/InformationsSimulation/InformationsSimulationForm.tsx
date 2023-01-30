/** @jsxImportSource @emotion/react */
import { Button, FormControl, FormErrorMessage, FormLabel, Text } from "@chakra-ui/react"
import { FunctionComponent, useCallback } from "react"
import { Form, useField } from "react-final-form"

import { ActionInformationsSimulationData, FormState } from "../../globals"

import {
  parseBooleanFormValue,
  parseBooleanStateValue,
  parseIntFormValue,
  parseIntStateValue,
  required,
} from "../../utils/formHelpers"

import { Input as InputChakra } from "@chakra-ui/input"
import ActionBar from "../../components/ActionBar"
import AnneeDeclaration from "../../components/AnneeDeclaration"
import ButtonAction from "../../components/ds/ButtonAction"
import FormStack from "../../components/ds/FormStack"
import { IconEdit } from "../../components/ds/Icons"
import InputRadio from "../../components/ds/InputRadio"
import InputRadioGroup from "../../components/ds/InputRadioGroup"
import FormAutoSave from "../../components/FormAutoSave"
import FormSubmit from "../../components/FormSubmit"
import { hasFieldError } from "../../components/Input"

import { useParams } from "react-router-dom"
import InputDateGroup from "../../components/ds/InputDateGroup"
import FormError from "../../components/FormError"
import RadiosBoolean from "../../components/RadiosBoolean"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import { useDeclaration } from "../../hooks/useDeclaration"
import { parseDate } from "../../utils/date"
import { isFrozenDeclaration } from "../../utils/isFrozenDeclaration"

const validateForm = ({
  nomEntreprise,
  anneeDeclaration,
  finPeriodeReference,
  periodeSuffisante,
}: {
  nomEntreprise: string
  anneeDeclaration: string
  finPeriodeReference: string | undefined
  periodeSuffisante: string | undefined
}) => {
  const isFilledPeriodeSuffisante = periodeSuffisante !== undefined

  const parsedFinPeriodeReference = isFilledPeriodeSuffisante ? parseDate(finPeriodeReference as string) : undefined

  return {
    nomEntreprise: nomEntreprise ? undefined : "Le nom n'est pas valide",
    anneeDeclaration: anneeDeclaration ? undefined : "Veuillez sélectionner une année de déclaration dans la liste",
    periodeSuffisante: isFilledPeriodeSuffisante
      ? undefined
      : "Veuilez indiquer si la période de référence est suffisante",
    finPeriodeReference:
      periodeSuffisante !== "true" ||
      (parsedFinPeriodeReference !== undefined &&
        parsedFinPeriodeReference.getFullYear().toString() === anneeDeclaration)
        ? undefined
        : {
            correspondanceAnneeDeclaration:
              "L'année de fin de période de référence doit correspondre à l'année au titre de laquelle les indicateurs sont calculés",
          },
  }
}

const FieldPeriodeReference = ({ readOnly, onClick }: { readOnly: boolean; onClick: () => void }) => (
  <InputDateGroup
    fieldName="finPeriodeReference"
    isReadOnly={readOnly}
    label="Date de fin de la période de référence choisie pour le calcul de votre Index (jj/mm/aaaa)"
  >
    <Button mt={2} onClick={onClick} disabled={readOnly} variant="solid" size="sm" px="8" py="5" colorScheme="primary">
      Sélectionner la fin
      <br /> de l'année civile
    </Button>
  </InputDateGroup>
)

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

const FieldPeriodeSuffisante = ({ readOnly }: { readOnly: boolean }) => {
  const field = useField("periodeSuffisante", { validate })

  return (
    <RadiosBoolean
      fieldName="periodeSuffisante"
      value={field.input.value}
      readOnly={readOnly}
      label="Disposez-vous d'une période de 12 mois consécutifs pour le calcul de vos indicateurs ?"
    />
  )
}

type Params = {
  code: string
}

const InformationsSimulationForm: FunctionComponent = () => {
  const { code } = useParams<Params>()
  const { state, dispatch } = useAppStateContextProvider()

  const updateInformationsSimulation = useCallback(
    (data: ActionInformationsSimulationData) => dispatch({ type: "updateInformationsSimulation", data }),
    [dispatch],
  )

  const validateInformationsSimulation = useCallback(
    (valid: FormState) => dispatch({ type: "validateInformationsSimulation", valid }),
    [dispatch],
  )

  const { declaration } = useDeclaration(state?.informationsEntreprise?.siren, state?.informations?.anneeDeclaration)

  const frozenDeclaration = isFrozenDeclaration(state)
  if (!state) return null

  const alreadyDeclared = declaration?.data?.id === code

  const readOnly = frozenDeclaration || state.informations.formValidated === "Valid"

  const informations = state.informations

  const initialValues = {
    nomEntreprise: informations.nomEntreprise,
    trancheEffectifs: informations.trancheEffectifs,
    anneeDeclaration: parseIntStateValue(informations.anneeDeclaration),
    finPeriodeReference: informations.finPeriodeReference,
    periodeSuffisante:
      informations.periodeSuffisante !== undefined
        ? parseBooleanStateValue(informations.periodeSuffisante)
        : // si periodeSuffisante est null et que finPeriodeReference est non null, alors c'est une simu/décla ancienne et on doit considérer que ce champ est à Oui.
        informations.finPeriodeReference
        ? "true"
        : undefined,
  }

  const saveForm = (formData: typeof initialValues) => {
    const { nomEntreprise, trancheEffectifs, anneeDeclaration, finPeriodeReference, periodeSuffisante } = formData

    updateInformationsSimulation({
      nomEntreprise,
      trancheEffectifs,
      anneeDeclaration: parseIntFormValue(anneeDeclaration),
      ...(parseBooleanFormValue(periodeSuffisante) && { finPeriodeReference }),
      periodeSuffisante: periodeSuffisante === undefined ? undefined : parseBooleanFormValue(periodeSuffisante),
    })
  }

  const onSubmit = (formData: typeof initialValues) => {
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
            {submitFailed && hasValidationErrors && (
              <FormError message="Cette page ne peut être validée car tous les champs ne sont pas renseignés." />
            )}
            <FieldNomEntreprise readOnly={readOnly} />
            <AnneeDeclaration
              label="Année au titre de laquelle les indicateurs sont calculés"
              name="anneeDeclaration"
              readOnly={readOnly || alreadyDeclared}
            />
            {alreadyDeclared && (
              <Text color="gray.600" fontSize="sm" as="i" mb="8">
                L'année ne peut pas être modifiée car une déclaration a déjà été validée et transmise.
              </Text>
            )}
            <FormControl isReadOnly={readOnly}>
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
            <FieldPeriodeSuffisante readOnly={readOnly} />
            {values.periodeSuffisante === "true" && (
              <>
                <FieldPeriodeReference
                  readOnly={readOnly || !parseIntFormValue(values.anneeDeclaration)}
                  onClick={form.mutators.selectEndOfYear}
                />
              </>
            )}
          </FormStack>
          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink
                to={values.periodeSuffisante === "true" ? "/effectifs" : "/recapitulatif"}
                label="Suivant"
              />
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
              <FormSubmit />
            </ActionBar>
          )}
        </form>
      )}
    </Form>
  )
}

function FieldNomEntreprise({ readOnly }: { readOnly: boolean }) {
  const label = "nomEntreprise"
  const field = useField(label, { validate })
  const error = hasFieldError(field.meta)

  return (
    <FormControl isInvalid={error}>
      <FormLabel htmlFor={label}>Nom de la simulation</FormLabel>
      <InputChakra id={label} placeholder={"Ex : nom_entreprise_date"} isReadOnly={readOnly} {...field.input} />
      <FormErrorMessage>{error && "Le nom n'est pas valide"}</FormErrorMessage>
    </FormControl>
  )
}

export default InformationsSimulationForm
