/** @jsx jsx */
import { Fragment } from "react"
import { css, jsx } from "@emotion/core"
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

import globalStyles from "../../utils/globalStyles"

import { mustBeNumber, parseIntFormValue, parseIntStateValue, required } from "../../utils/formHelpers"

import ActionBar from "../../components/ActionBar"
import ActionLink from "../../components/ActionLink"
import CodeNaf, { codeNafFromCode } from "../../components/CodeNaf"
import FieldSiren from "../../components/FieldSiren"
import FormAutoSave from "../../components/FormAutoSave"
import FormSubmit from "../../components/FormSubmit"
import NombreEntreprises, { validator as validateNombreEntreprises } from "../../components/NombreEntreprises"
import RadioButtons from "../../components/RadioButtons"
import RegionsDepartements, { departementFromCode, regionFromCode } from "../../components/RegionsDepartements"
import { departementCode } from "../../components/RegionsDepartements"
import TextField from "../../components/TextField"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"
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

const validateCodePostal = (codePostal: string, departement: string) => {
  let dptCode = departementCode[departement]
  if (!dptCode) return undefined
  if (["2A", "2B"].includes(dptCode)) {
    dptCode = "20"
  }
  const requiredError = required(codePostal)
  const mustBeNumberError = mustBeNumber(codePostal)
  const mustBe5DigitsError = codePostal && codePostal.length !== 5
  const mustBeInDepartementError = codePostal && !codePostal.startsWith(dptCode)
  if (!requiredError && !mustBeNumberError && !mustBe5DigitsError && !mustBeInDepartementError) {
    return undefined
  } else {
    return {
      required: requiredError,
      mustBeNumber: mustBeNumberError,
      mustBe5Digits: mustBe5DigitsError,
      mustBeInDepartementError: mustBeInDepartementError,
    }
  }
}

const validateForm = ({
  nomEntreprise,
  siren,
  codeNaf,
  region,
  departement,
  codePostal,
  commune,
  structure,
  nomUES,
}: {
  nomEntreprise: string
  siren: string
  codeNaf: string
  region: string
  departement: string
  codePostal: string
  commune: string
  structure: Structure
  nomUES: string
}) => ({
  nomEntreprise: validate(nomEntreprise),
  siren: validate(siren),
  codeNaf: validate(codeNaf),
  region: validate(region),
  departement: validate(departement),
  adresse: undefined, // address is not filled for some case returned by the API entreprise.
  codePostal: validateCodePostal(codePostal, departement),
  commune: validate(commune),
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

interface Props {
  informationsEntreprise: AppState["informationsEntreprise"]
  readOnly: boolean
  updateInformationsEntreprise: (data: ActionInformationsEntrepriseData) => void
  validateInformationsEntreprise: (valid: FormState) => void
}

function InformationsEntrepriseForm({
  informationsEntreprise,
  readOnly,
  updateInformationsEntreprise,
  validateInformationsEntreprise,
}: Props) {
  const initialValues = {
    nomEntreprise: informationsEntreprise.nomEntreprise,
    siren: informationsEntreprise.siren,
    codeNaf: informationsEntreprise.codeNaf,
    region: informationsEntreprise.region,
    departement: informationsEntreprise.departement,
    adresse: informationsEntreprise.adresse,
    codePostal: informationsEntreprise.codePostal,
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
      {({ form, handleSubmit, values, hasValidationErrors, errors, submitFailed }) => (
        <form onSubmit={handleSubmit} css={styles.container}>
          <FormAutoSave saveForm={saveForm} />
          <RadioButtons
            fieldName="structure"
            label="Vous déclarez en tant que"
            value={values.structure}
            readOnly={readOnly}
            choices={[
              {
                label: "Entreprise",
                value: "Entreprise",
              },
              {
                label: "Unité Economique et Sociale (UES)",
                value: "Unité Economique et Sociale (UES)",
              },
            ]}
          />

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
              })
            }
          />

          <TextField
            label={
              values.structure === "Unité Economique et Sociale (UES)"
                ? "Raison sociale de l'entreprise déclarant pour le compte de l'UES"
                : "Raison sociale de l'entreprise"
            }
            fieldName="nomEntreprise"
            errorText="le nom de l'entreprise n'est pas valide"
            readOnly={true}
          />
          <CodeNaf label="Code NAF" name="codeNaf" readOnly={true} />
          <RegionsDepartements nameRegion="region" nameDepartement="departement" readOnly={true} />
          <TextField label="Adresse" fieldName="adresse" errorText="l'adresse n’est pas valide" readOnly={true} />
          <TextField
            label="Code Postal"
            fieldName="codePostal"
            errorText={
              errors.codePostal &&
              (errors.codePostal.required || errors.codePostal.mustBeNumber || errors.codePostal.mustBe5Digits)
                ? "le code postal doit être composé de 5 chiffres"
                : `le code postal ne correspond pas au département choisi (${departementCode[values.departement]})`
            }
            readOnly={true}
          />
          <TextField label="Commune" fieldName="commune" errorText="la commune n'est pas valide" readOnly={true} />

          {values.structure === "Unité Economique et Sociale (UES)" && (
            <Fragment>
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
              <h3>Saisie du numéro Siren des entreprises composant l'UES (ne pas inclure l'entreprise déclarante)</h3>
              <FieldArray name="entreprisesUES">
                {({ fields }) => {
                  return (
                    <Fragment>
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
                    </Fragment>
                  )
                }}
              </FieldArray>
            </Fragment>
          )}

          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/informations-declarant" label="suivant" />
              &emsp;
              {informationsEntreprise.formValidated === "Valid" && (
                <p css={styles.edit}>
                  <ActionLink onClick={() => validateInformationsEntreprise("None")}>
                    modifier les données saisies
                  </ActionLink>
                </p>
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

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
  }),
  edit: css({
    marginTop: 14,
    marginBottom: 14,
    textAlign: "center",
  }),
  add: css({
    display: "flex",
    alignItems: "center",
    marginTop: 46 - 18 - 5,
    textDecoration: "none",
  }),
  addIcon: css({
    width: 32,
    height: 32,
    marginRight: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: globalStyles.colors.default,
    borderRadius: 16,
  }),
  spacerAdd: css({
    height: 32,
    marginTop: 46 - 18 - 5,
  }),
}

export default InformationsEntrepriseForm
