import React, { FunctionComponent } from "react"
import { FormControl, FormLabel, Text } from "@chakra-ui/react"
import { MutableState, Tools } from "final-form"
import arrayMutators from "final-form-arrays"
import { Form } from "react-final-form"
import createDecorator from "final-form-calculate"
import { FieldArray } from "react-final-form-arrays"

import {
  AppState,
  FormState,
  ActionInformationsEntrepriseData,
  Structure,
  EntrepriseUES,
  EntrepriseType,
} from "../../globals"

import { parseIntFormValue, parseIntStateValue, required } from "../../utils/formHelpers"

import ButtonAction from "../../components/ds/ButtonAction"
import { IconEdit } from "../../components/ds/Icons"
import InputRadio from "../../components/ds/InputRadio"
import InputRadioGroup from "../../components/ds/InputRadioGroup"
import FormStack from "../../components/ds/FormStack"
import FakeInputGroup from "../../components/ds/FakeInputGroup"
import ActionBar from "../../components/ActionBar"
import { codeNafFromCode } from "../../components/CodeNaf"
import FieldSiren from "../../components/FieldSiren"
import FormAutoSave from "../../components/FormAutoSave"
import FormSubmit from "../../components/FormSubmit"
import NombreEntreprises, { validator as validateNombreEntreprises } from "../../components/NombreEntreprises"
import { departementFromCode, regionFromCode } from "../../components/RegionsDepartements"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"
import EntrepriseUESInput from "./components/EntrepriseUESInputField"
import FormError from "../../components/FormError"
import TextField from "../../components/TextField"

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

const calculator = createDecorator({
  field: "nombreEntreprises",
  updates: {
    entreprisesUES: (nombreEntreprises, { entreprisesUES }: any) =>
      adaptEntreprisesUESSize(nombreEntreprises, entreprisesUES),
  },
})

const adaptEntreprisesUESSize = (nombreEntreprises: string, entreprisesUES: Array<EntrepriseUES>) => {
  if (validateNombreEntreprises(nombreEntreprises) === undefined) {
    // Il faut une entreprise à déclarer de moins vu que l'entreprise déclarant pour le compte de l'UES a déjà renseigné ses infos
    const newSize = Number(nombreEntreprises) - 1
    while (newSize > entreprisesUES.length) {
      // Augmenter la taille de l'array si nécessaire
      entreprisesUES.push({ nom: "", siren: "" })
    }
    // Réduire la taille de l'array si nécessaire
    entreprisesUES.length = newSize
  }
  return entreprisesUES
}

interface InformationsEntrepriseFormProps {
  informationsEntreprise: AppState["informationsEntreprise"]
  readOnly: boolean
  updateInformationsEntreprise: (data: ActionInformationsEntrepriseData) => void
  validateInformationsEntreprise: (valid: FormState) => void
  alreadyDeclared: boolean
}

const InformationsEntrepriseForm: FunctionComponent<InformationsEntrepriseFormProps> = ({
  informationsEntreprise,
  readOnly,
  updateInformationsEntreprise,
  validateInformationsEntreprise,
  alreadyDeclared,
}) => {
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

    updateInformationsEntreprise({
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
    validateInformationsEntreprise("Valid")
  }

  // Form mutator utilisé par le composant NombreEntreprise pour ne changer la
  // valeur du state qu'une fois la confirmation validée
  const newNombreEntreprises = (
    [name, newValue]: [string, string],
    state: MutableState<any>,
    { changeValue }: Tools<any>,
  ) => {
    changeValue(state, name, () => newValue)
  }

  return (
    <Form
      onSubmit={onSubmit}
      mutators={{
        // potentially other mutators could be merged here
        newNombreEntreprises,
        ...arrayMutators,
      }}
      initialValues={initialValues}
      validate={validateForm}
      decorators={[calculator]}
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
              <FormError message="Le formulaire ne peut pas être validé si tous les champs ne sont pas remplis." />
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
                <NombreEntreprises
                  fieldName="nombreEntreprises"
                  label="Nombre d'entreprises composant l'UES (le déclarant compris)"
                  entreprisesUES={informationsEntreprise.entreprisesUES}
                  newNombreEntreprises={form.mutators.newNombreEntreprises}
                  readOnly={readOnly}
                />
                <Text>
                  Saisie du numéro Siren des entreprises composant l'UES (ne pas inclure l'entreprise déclarante)
                </Text>
                <FieldArray name="entreprisesUES">
                  {({ fields }) => {
                    return (
                      <>
                        {fields.map((entrepriseUES, index) => (
                          <EntrepriseUESInput
                            key={entrepriseUES}
                            nom={`${entrepriseUES}.nom`}
                            siren={`${entrepriseUES}.siren`}
                            index={index}
                            readOnly={readOnly}
                            updateSirenData={(sirenData: EntrepriseType) =>
                              form.change(`${entrepriseUES}.nom`, sirenData.raison_sociale || "")
                            }
                          />
                        ))}
                      </>
                    )
                  }}
                </FieldArray>
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
                  onClick={() => validateInformationsEntreprise("None")}
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
