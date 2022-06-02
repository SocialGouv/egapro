import React, { FunctionComponent } from "react"
import { Text } from "@chakra-ui/react"
import { Form } from "react-final-form"
import { z } from "zod"

import { AppState, FormState, ActionInformationsProgressionCorrectionData } from "../../globals"

import { IconEdit } from "../../components/ds/Icons"
import InputGroup from "../../components/ds/InputGroup"
import FormStack from "../../components/ds/FormStack"
import { formValidator } from "../../components/ds/form-lib"
import ActionBar from "../../components/ActionBar"
import FormAutoSave from "../../components/FormAutoSave"
import FormSubmit from "../../components/FormSubmit"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"
import FormError from "../../components/FormError"
import ButtonAction from "../../components/ds/ButtonAction"
import TextareaGroup from "../../components/ds/TextareaGroup"
import { buildSummaryFromState } from "../../utils/helpers"

const required_error = "Un objectif est requis pour cet indicateur"
const invalid_type_error = "L'objectif doit être un nombre entre 75 et 100"

// TOdo : paramétrer avec en min la note actuelle des indicateurs. Pour cela, il faut faire une fonction de ce qui est fait dans Recapitulatif, qui calcule les notes (elles ne sont pas stockées dans l'AppState)
const objectifValidator = z
  .string({
    required_error,
  })
  .nonempty({ message: required_error })
  .refine((value) => Number(value) >= 75 && Number(value) <= 100, { message: invalid_type_error })

const FormInputs = z.object({
  objectifIndicateur1: objectifValidator,
  objectifIndicateur2: objectifValidator,
  objectifIndicateur3: objectifValidator,
  objectifIndicateur2et3: objectifValidator,
  objectifIndicateur4: objectifValidator,
  objectifIndicateur5: objectifValidator,
  // datePublicationObjectifs: string
  // datePublicationMesures: string

  // nom: z
  //   .string({
  //     required_error: "Le nom ne peut pas être vide",
  //     invalid_type_error: "Le nom n’est pas valide",
  //   })
  //   .min(1, { message: "Le nom ne peut pas être vide" }),
  // prenom: z
  //   .string({
  //     required_error: "Le prénom ne peut pas être vide",
  //     invalid_type_error: "Le prénom n'est pas valide",
  //   })
  //   .min(1, { message: "Le prénom ne peut pas être vide" }),
  // tel: z.string({ required_error: "Le numéro de téléphone est requis" }).regex(new RegExp("^[0-9]{10}$"), {
  //   message: "Le numéro de téléphone doit être composé de 10 chiffres",
  // }),
  // email: z.string({ required_error: "L'adresse mail est requise" }).email({ message: "L'adresse mail est invalide" }),
  // acceptationCGU: z.literal(true, {
  //   invalid_type_error: "Veuillez accepter les CGUs",
  // }),
})

interface InformationsProgressionCorrectionFormProps {
  state: AppState
  informationsProgressionCorrection: AppState["informationsProgressionCorrection"]
  readOnly: boolean
  updateInformationsProgressionCorrection: (data: ActionInformationsProgressionCorrectionData) => void
  validateInformationsProgressionCorrection: (valid: FormState) => void
}

const InformationsProgressionCorrectionForm: FunctionComponent<InformationsProgressionCorrectionFormProps> = ({
  state,
  informationsProgressionCorrection,
  readOnly,
  updateInformationsProgressionCorrection,
  validateInformationsProgressionCorrection,
}) => {
  const initialValues: ActionInformationsProgressionCorrectionData = {
    ...informationsProgressionCorrection,
  }

  const saveForm = (formData: ActionInformationsProgressionCorrectionData) => {
    updateInformationsProgressionCorrection(formData)
  }

  const onSubmit = (formData: ActionInformationsProgressionCorrectionData) => {
    saveForm(formData)
    validateInformationsProgressionCorrection("Valid")
  }

  const { noteIndex, trancheEffectifs } = buildSummaryFromState(state)

  // Helper for UI
  const typeIndex = !noteIndex ? "Impossible state" : noteIndex > 85 ? "85:100" : noteIndex >= 75 ? "75:85" : "0:75"

  console.log("typeIndex", typeIndex)

  console.log("noteIndex", noteIndex)
  console.log("trancheEffectifs", trancheEffectifs)

  const siteWebLabel =
    typeIndex === "85:100"
      ? "Adresse exacte de la page Internet (URL) sur laquelle devront être publiés les objectifs de progression"
      : typeIndex === "75:85"
      ? "Adresse exacte de la page Internet (URL) sur laquelle devront être publiés les objectifs de progression et les mesures de correction"
      : ""

  const siteWebDetails =
    typeIndex === "85:100"
      ? "Pour rappel, les objectifs de progression doivent être publiés sur la même page du site internet que celle où figurent les résultats obtenus à chacun des indicateurs et le niveau de résultat à l'Index."
      : typeIndex === "75:85"
      ? "Pour rappel, les objectifs de progression et les mesures de correction doivent être publiés sur la même page du site internet que celle où figurent les résultats obtenus à chacun des indicateurs et le niveau de résultat à l'Index."
      : ""

  const modaliteQuestion = `Préciser les modalités de communication des objectifs de progression ${
    typeIndex === "75:85" && "et des mesures de correction"
  } auprès de vos salariés`

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={initialValues}
      validate={formValidator(FormInputs)}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ handleSubmit, hasValidationErrors, submitFailed }) => (
        <form onSubmit={handleSubmit}>
          <FormAutoSave saveForm={saveForm} />
          <FormStack>
            {submitFailed && hasValidationErrors && (
              <FormError message="Le formulaire ne peut pas être validé si tous les champs ne sont pas remplis." />
            )}
            <Text>
              Conformément à la loi n° 2020-1721 du 29 décembre 2020 de finances pour 2021 et aux articles L. 1142-9-1
              et D. 1142-6-1 du code du travail, indiquer les objectifs de progression fixés pour chaque indicateur pour
              lequel la note maximale n'a pas été atteinte :
            </Text>
            <InputGroup
              label="Indicateur Écart de rémunération *"
              fieldName="objectifIndicateur1"
              isReadOnly={readOnly}
              autocomplete="off"
            />
            <InputGroup
              label="Indicateur Écart de taux d'augmentations individuelles"
              fieldName="objectifIndicateur2"
              isReadOnly={readOnly}
              autocomplete="off"
            />
            {["251 à 999", "1000 et plus"].includes(state.informations.trancheEffectifs) && (
              <InputGroup
                label="Indicateur Écart de taux de promotions (uniquement pour les entreprises > 250 salariés)"
                fieldName="objectifIndicateur3"
                isReadOnly={readOnly}
                autocomplete="off"
              />
            )}
            {/*

            Je cherche à faire fonctionner cette nouvelle page de formulaire.

            - Voir dans quel cas afficher les indicateurs, 2, 3 ou 2&3
            - voir comment mettre des inputs date
            - conditions zod pour les nombre et les dates : ne plus avoir qu'une seule erreur même si 2 erreurs trouvées
            - griser les cases quand la note est maximale ou non calculable


            */}
            <InputGroup
              label="Indicateur Retour de congé maternité"
              fieldName="objectifIndicateur2et3"
              isReadOnly={readOnly}
              autocomplete="off"
            />
            <InputGroup
              label="Indicateur Dix plus hautes rémunérations"
              fieldName="objectifIndicateur4"
              isReadOnly={readOnly}
              autocomplete="off"
            />
            <InputGroup
              label="Indicateur Dix plus hautes rémunérations"
              fieldName="objectifIndicateur5"
              isReadOnly={readOnly}
              autocomplete="off"
            />
            <InputGroup
              label="Date de publication des objectifs de progression"
              fieldName="datePublicationObjectifs"
              isReadOnly={readOnly}
              autocomplete="off"
            />
            <InputGroup
              label="Date de publication des mesures de correction"
              fieldName="datePublicationMesures"
              isReadOnly={readOnly}
              autocomplete="off"
            />
            {state.declaration.publicationSurSiteInternet ? (
              <>
                <InputGroup
                  label={siteWebLabel + " *"}
                  fieldName="siteInternetPublicationObjectifsMesures"
                  isReadOnly={true}
                />
                <Text>{siteWebDetails}</Text>
              </>
            ) : (
              <>
                <InputGroup
                  label="Préciser les modalités de communication des objectifs de progression et des mesures de correction auprès de vos salariés"
                  fieldName="modalitesPublicationObjectifsMesures"
                  isReadOnly={readOnly}
                  autocomplete="off"
                />
                <TextareaGroup
                  label={modaliteQuestion}
                  fieldName="modalitesPublicationObjectifsMesures"
                  isReadOnly={readOnly}
                />
              </>
            )}
          </FormStack>
          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/declaration" label="Suivant" />
              &emsp;
              {informationsProgressionCorrection.formValidated === "Valid" && (
                <ButtonAction
                  leftIcon={<IconEdit />}
                  label="Modifier les données saisies"
                  onClick={() => validateInformationsProgressionCorrection("None")}
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

export default InformationsProgressionCorrectionForm
