import { Box, Flex, FormControl, FormLabel, Text } from "@chakra-ui/react"
import arrayMutators from "final-form-arrays"
import createDecorator from "final-form-calculate"
import React, { FunctionComponent } from "react"
import { Field, Form } from "react-final-form"
import { FieldArray } from "react-final-form-arrays"

import { ActionBarSingleForm } from "../../components/ActionBarSingleForm"
import { codeNafFromCode } from "../../components/CodeNaf"
import ButtonAction from "../../components/ds/ButtonAction"
import FakeInputGroup from "../../components/ds/FakeInputGroup"
import FormStack from "../../components/ds/FormStack"
import { IconPlusCircle, IconWarning } from "../../components/ds/Icons"
import InputRadio from "../../components/ds/InputRadio"
import InputRadioGroup from "../../components/ds/InputRadioGroup"
import FieldSiren from "../../components/FieldSiren"
import FormAutoSave from "../../components/FormAutoSave"
import FormError from "../../components/FormError"
import { departementFromCode, regionFromCode } from "../../components/RegionsDepartements"
import TextField from "../../components/TextField"
import { EntrepriseType, Structure } from "../../globals"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import { useDeclaration } from "../../hooks/useDeclaration"
import { timestampToFrDate } from "../../utils/date"
import { isFormValid, parseIntFormValue, parseIntStateValue, required } from "../../utils/formHelpers"
import { isFrozenDeclaration } from "../../utils/isFrozenDeclaration"
import EntrepriseUESInput from "./components/EntrepriseUESInputField"

const isRequired = (value: string) => {
  const requiredError = required(value)

  return requiredError ? { required: requiredError } : undefined
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
  nomEntreprise: isRequired(nomEntreprise),
  siren: isRequired(siren),
  codeNaf: isRequired(codeNaf),
  structure: isRequired(structure),
  nomUES: structure === "Unité Economique et Sociale (UES)" ? isRequired(nomUES) : undefined,
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
  code: string
}

const InformationsEntrepriseForm: FunctionComponent<InformationsEntrepriseFormProps> = ({ code }) => {
  const { state, dispatch } = useAppStateContextProvider()

  const { declaration } = useDeclaration(state?.informationsEntreprise?.siren, state?.informations?.anneeDeclaration)

  if (!state) return null

  const alreadyDeclared = declaration?.data?.id === code

  const informationsEntreprise = state.informationsEntreprise
  const year = state.informations.anneeDeclaration || new Date().getFullYear() // fallback but this case should not happen.

  const readOnly = isFormValid(state.informationsEntreprise)

  const frozenDeclaration = isFrozenDeclaration(state)

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
    entreprisesUES: informationsEntreprise.entreprisesUES.length
      ? informationsEntreprise.entreprisesUES
      : [
          {
            nom: "",
            siren: "",
          },
        ],
  }

  const saveForm = (formData: typeof initialValues) => {
    dispatch({
      type: "updateInformationsEntreprise",
      data: {
        ...formData,
        nombreEntreprises: parseIntFormValue(formData.nombreEntreprises),
      },
    })
  }

  const onSubmit = (formData: any) => {
    saveForm(formData)
    dispatch({ type: "validateInformationsEntreprise", valid: "Valid" })
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
              <>
                <FakeInputGroup
                  label="Siren"
                  message={
                    alreadyDeclared
                      ? "Le Siren n'est pas modifiable car une déclaration a déjà été validée et transmise."
                      : undefined
                  }
                >
                  {informationsEntreprise.siren}
                </FakeInputGroup>
                {declaration && declaration.declared_at && (
                  <Text mt={2} color="red.500" lineHeight="4">
                    <IconWarning mr="2" />
                    {`Attention, une déclaration pour le Siren ${informationsEntreprise.siren} et
                    l'année ${year}, a déjà été transmise le ${timestampToFrDate(declaration.declared_at)}  par ${
                      declaration.data.déclarant.email
                    }`}
                    .
                  </Text>
                )}
              </>
            ) : (
              <FieldSiren
                label="Siren"
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

                <hr />
                <Box>
                  <Box mt="0">
                    <Text as="b">Siren des entreprises composant l'UES</Text>
                    &nbsp;(ne pas inclure l'entreprise déclarante)
                  </Box>
                </Box>

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
                            {!readOnly && values.nombreEntreprises > 2 && (
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

                <Box>
                  <Box mt="6">
                    <Field name="nombreEntreprises">
                      {({ input }) => (
                        <Text mb={4} textAlign="right" fontStyle={"italic"}>
                          {input.value} entreprises composent l'UES (déclarant compris)
                        </Text>
                      )}
                    </Field>
                  </Box>
                </Box>
              </>
            )}
          </FormStack>

          <ActionBarSingleForm
            readOnly={readOnly}
            frozenDeclaration={frozenDeclaration}
            to="/informations-declarant"
            onClick={() => dispatch({ type: "validateInformationsEntreprise", valid: "None" })}
          />
        </form>
      )}
    </Form>
  )
}

export default InformationsEntrepriseForm
