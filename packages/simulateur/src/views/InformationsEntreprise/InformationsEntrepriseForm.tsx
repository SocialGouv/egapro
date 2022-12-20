import { Box, Flex, FormControl, FormLabel, Text } from "@chakra-ui/react"
import arrayMutators from "final-form-arrays"
import React, { FunctionComponent } from "react"
import { Form } from "react-final-form"
import { FieldArray } from "react-final-form-arrays"

import { ActionInformationsEntrepriseData, AppState, EntrepriseType, FormState, Structure } from "../../globals"

import { parseIntFormValue, parseIntStateValue, required } from "../../utils/formHelpers"

import createDecorator from "final-form-calculate"
import ActionBar from "../../components/ActionBar"
import { codeNafFromCode } from "../../components/CodeNaf"
import ButtonAction from "../../components/ds/ButtonAction"
import FakeInputGroup from "../../components/ds/FakeInputGroup"
import FormStack from "../../components/ds/FormStack"
import { IconEdit, IconPlusCircle } from "../../components/ds/Icons"
import InputRadio from "../../components/ds/InputRadio"
import InputRadioGroup from "../../components/ds/InputRadioGroup"
import FieldSiren from "../../components/FieldSiren"
import FormAutoSave from "../../components/FormAutoSave"
import FormError from "../../components/FormError"
import FormSubmit from "../../components/FormSubmit"
import NombreEntreprises from "../../components/NombreEntreprises"
import { departementFromCode, regionFromCode } from "../../components/RegionsDepartements"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"
import TextField from "../../components/TextField"
import EntrepriseUESInput from "./components/EntrepriseUESInputField"

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

const validateForm = ({
  nomEntreprise,
  siren,
  codeNaf,
  structure,
  nomUES,
}: {
  nomEntreprise: string
  siren: string
  codeNaf: string
  structure: Structure
  nomUES: string
}) => ({
  nomEntreprise: validate(nomEntreprise),
  siren: validate(siren),
  codeNaf: validate(codeNaf),
  structure: validate(structure),
  nomUES: structure === "Unité Economique et Sociale (UES)" ? validate(nomUES) : undefined,
})

// Update state when change on nombreEntreprises is made.
const updateNombreEntreprises = createDecorator({
  field: "entreprisesUES",
  updates: {
    nombreEntreprises: (entreprisesUES) => {
      return entreprisesUES.length + 1
    },
  },
})

interface InformationsEntrepriseFormProps {
  state: AppState
  update: (data: ActionInformationsEntrepriseData) => void
  validate: (valid: FormState) => void
  alreadyDeclared: boolean
}

const InformationsEntrepriseForm: FunctionComponent<InformationsEntrepriseFormProps> = ({
  state,
  update,
  validate,
  alreadyDeclared,
}) => {
  const informationsEntreprise = state.informationsEntreprise
  const readOnly = state.informationsEntreprise.formValidated === "Valid"

  const year = state?.informations?.anneeDeclaration || new Date().getFullYear() // fallback but this case should not happen.

  const initialValues = {
    nomEntreprise: informationsEntreprise.nomEntreprise,
    siren: informationsEntreprise.siren,
    codeNaf: informationsEntreprise.codeNaf,
    region: informationsEntreprise.region,
    departement: informationsEntreprise.departement,
    adresse: informationsEntreprise.adresse,
    codePostal: informationsEntreprise.codePostal,
    codePays: informationsEntreprise.codePays,
    commune: informationsEntreprise.commune,
    structure: informationsEntreprise.structure,
    nomUES: informationsEntreprise.nomUES,
    nombreEntreprises: parseIntStateValue(informationsEntreprise.nombreEntreprises),
    entreprisesUES: informationsEntreprise.entreprisesUES,
  }

  const saveForm = (formData: any) => {
    const {
      nomEntreprise,
      siren,
      codeNaf,
      region,
      departement,
      adresse,
      codePostal,
      codePays,
      commune,
      structure,
      nomUES,
      nombreEntreprises,
      entreprisesUES,
    } = formData

    update({
      nomEntreprise: nomEntreprise,
      siren: siren,
      codeNaf: codeNaf,
      region,
      departement,
      adresse,
      codePostal,
      codePays,
      commune,
      structure,
      nomUES,
      nombreEntreprises: parseIntFormValue(nombreEntreprises),
      entreprisesUES,
    })
  }

  const onSubmit = (formData: any) => {
    saveForm(formData)
    validate("Valid")
  }

  return (
    <Form
      onSubmit={onSubmit}
      mutators={{
        ...arrayMutators,
      }}
      initialValues={initialValues}
      validate={validateForm}
      decorators={[updateNombreEntreprises]}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ form, handleSubmit, values, hasValidationErrors, submitFailed, errors }) => (
        <form onSubmit={handleSubmit}>
          <FormAutoSave saveForm={saveForm} />
          <FormStack>
            {submitFailed && hasValidationErrors && (
              <FormError message="Cette page ne peut être validée car tous les champs ne sont pas renseignés." />
            )}
            <FormControl isReadOnly={readOnly}>
              <FormLabel as="div">Vous déclarez en tant que</FormLabel>
              <InputRadioGroup defaultValue={values.structure}>
                <InputRadio value="Entreprise" fieldName="structure" choiceValue="Entreprise" isReadOnly={readOnly}>
                  Entreprise
                </InputRadio>
                <InputRadio
                  value="Unité Economique et Sociale (UES)"
                  fieldName="structure"
                  choiceValue="Unité Economique et Sociale (UES)"
                  isReadOnly={readOnly}
                >
                  Unité Economique et Sociale (UES)
                </InputRadio>
              </InputRadioGroup>
            </FormControl>
            {readOnly || alreadyDeclared ? (
              <FakeInputGroup
                label="SIREN"
                message={
                  alreadyDeclared
                    ? "Le SIREN n'est pas modifiable car une déclaration a déjà été validée et transmise."
                    : undefined
                }
              >
                {informationsEntreprise.siren}
              </FakeInputGroup>
            ) : (
              <FieldSiren
                label="SIREN"
                name="siren"
                readOnly={readOnly}
                year={year}
                updateSirenData={(sirenData: EntrepriseType) =>
                  form.batch(() => {
                    form.change("nomEntreprise", sirenData.raison_sociale || "")
                    form.change("codeNaf", codeNafFromCode(sirenData.code_naf || ""))
                    form.change("region", regionFromCode(sirenData.région || ""))
                    form.change("departement", departementFromCode(sirenData.département || ""))
                    form.change("adresse", sirenData.adresse || "")
                    form.change("commune", sirenData.commune || "")
                    form.change("codePostal", sirenData.code_postal || "")
                    form.change("codePays", sirenData.code_pays || "")
                  })
                }
              />
            )}
            <FakeInputGroup
              label={
                values.structure === "Unité Economique et Sociale (UES)"
                  ? "Raison sociale de l'entreprise déclarant pour le compte de l'UES"
                  : "Raison sociale de l'entreprise"
              }
            >
              {initialValues.nomEntreprise}
            </FakeInputGroup>
            <FakeInputGroup label="Code NAF">{initialValues.codeNaf}</FakeInputGroup>
            <FakeInputGroup label="Région">{initialValues.region}</FakeInputGroup>
            <FakeInputGroup label="Département">{initialValues.departement}</FakeInputGroup>
            <FakeInputGroup label="Adresse">{initialValues.adresse}</FakeInputGroup>
            <FakeInputGroup label="Code postal">{initialValues.codePostal}</FakeInputGroup>
            <FakeInputGroup label="Commune">{initialValues.commune}</FakeInputGroup>
            <FakeInputGroup label="Code pays">{initialValues.codePays}</FakeInputGroup>
            {values.structure === "Unité Economique et Sociale (UES)" && (
              <>
                <TextField
                  label="Nom de l'UES"
                  fieldName="nomUES"
                  errorText="le nom de l'UES n'est pas valide"
                  readOnly={readOnly}
                />
                <NombreEntreprises readOnly={readOnly} />

                <Text>
                  Saisie du numéro Siren des entreprises composant l'UES (ne pas inclure l'entreprise déclarante)
                </Text>
                <FieldArray name="entreprisesUES">
                  {({ fields }) => {
                    return (
                      <>
                        {fields.map((entrepriseUES, index) => (
                          <Flex key={entrepriseUES} justifyContent="center" alignItems="start">
                            <EntrepriseUESInput
                              nom={`${entrepriseUES}.nom`}
                              siren={`${entrepriseUES}.siren`}
                              index={index}
                              readOnly={readOnly}
                              year={year}
                            />
                            {!readOnly && (
                              <Box style={{ marginLeft: 10, marginTop: 65 }}>
                                <button onClick={() => fields.remove(index)}>❌</button>
                              </Box>
                            )}
                          </Flex>
                        ))}
                      </>
                    )
                  }}
                </FieldArray>
                {!readOnly && (
                  <ButtonAction
                    size="md"
                    variant="outline"
                    label="Ajouter une entreprise à l'UES"
                    onClick={() => form.mutators.push("entreprisesUES", { nom: "", siren: "" })}
                    leftIcon={<IconPlusCircle />}
                  />
                )}
              </>
            )}
          </FormStack>

          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/informations-declarant" label="Suivant" />
              &emsp;
              {informationsEntreprise.formValidated === "Valid" && (
                <ButtonAction
                  leftIcon={<IconEdit />}
                  label="Modifier les données saisies"
                  onClick={() => validate("None")}
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

export default InformationsEntrepriseForm
