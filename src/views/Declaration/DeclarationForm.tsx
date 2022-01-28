import React, { FunctionComponent, useState } from "react"
import { Form, useField } from "react-final-form"

import { AppState, FormState, ActionDeclarationData } from "../../globals"

import ActionBar from "../../components/ActionBar"
import ActionLink from "../../components/ActionLink"
import InputDateGroup from "../../components/ds/InputDateGroup"
import FormAutoSave from "../../components/FormAutoSave"
import FormSubmit from "../../components/FormSubmit"
import MesuresCorrection from "../../components/MesuresCorrection"
import { logToSentry, parseDate } from "../../utils/helpers"
import RadiosBoolean from "../../components/RadiosBoolean"
import { isFormValid, parseBooleanFormValue, parseBooleanStateValue, required } from "../../utils/formHelpers"
import ButtonAction from "../../components/ButtonAction"
import ErrorMessage from "../../components/ErrorMessage"
import { resendReceipt } from "../../utils/api"
import FormStack from "../../components/ds/FormStack"
import TextareaGroup from "../../components/ds/TextareaGroup"
import InputGroup from "../../components/ds/InputGroup"
import { displayMetaErrors } from "../../utils/form-error-helpers"
import { hasFieldError } from "../../components/Input"

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
  finPeriodeReference,
  anneeDeclaration,
}: {
  finPeriodeReference: string
  anneeDeclaration: number | undefined
}) => {
  return ({
    datePublication,
    publicationSurSiteInternet,
    planRelance,
  }: {
    datePublication: string
    publicationSurSiteInternet?: string
    planRelance: string | undefined
  }) => {
    // Make sure we don't invalidate the form if the field `datePublication`
    // isn't present on the form (because the index can't be calculated).
    if (!datePublication) return
    const parsedDatePublication = parseDate(datePublication)
    const parsedFinPeriodeReference = parseDate(finPeriodeReference)

    return {
      datePublication:
        parsedDatePublication !== undefined &&
        parsedFinPeriodeReference !== undefined &&
        parsedDatePublication > parsedFinPeriodeReference
          ? undefined
          : {
              correspondanceFinPeriodeReference: `La date ne peut précéder la fin de la période de référence (${finPeriodeReference})`,
            },
      publicationSurSiteInternet:
        publicationSurSiteInternet !== undefined ? undefined : "Il vous faut sélectionner un mode de publication",
      planRelance:
        anneeDeclaration && anneeDeclaration >= 2021 && planRelance === undefined
          ? "Il vous faut indiquer si vous avez bénéficié du plan de relance"
          : undefined,
    }
  }
}

interface DeclarationFormProps {
  state: AppState
  noteIndex: number | undefined
  updateDeclaration: (data: ActionDeclarationData) => void
  resetDeclaration: () => void
  validateDeclaration: (valid: FormState) => void
  apiError: string | undefined
  declaring: boolean
}

const DeclarationForm: FunctionComponent<DeclarationFormProps> = ({
  state,
  noteIndex,
  updateDeclaration,
  resetDeclaration,
  validateDeclaration,
  apiError,
  declaring,
}) => {
  const declaration = state.declaration
  const indicateurUnParCSP = state.indicateurUn.csp
  const finPeriodeReference = state.informations.finPeriodeReference
  const anneeDeclaration = state.informations.anneeDeclaration
  const readOnly = isFormValid(state.declaration) && !declaring

  const initialValues = {
    mesuresCorrection: declaration.mesuresCorrection,
    cseMisEnPlace:
      declaration.cseMisEnPlace !== undefined ? parseBooleanStateValue(declaration.cseMisEnPlace) : undefined,
    dateConsultationCSE: declaration.dateConsultationCSE,
    datePublication: declaration.datePublication,
    publicationSurSiteInternet:
      declaration.publicationSurSiteInternet !== undefined
        ? parseBooleanStateValue(declaration.publicationSurSiteInternet)
        : undefined,
    lienPublication: declaration.lienPublication,
    modalitesPublication: declaration.modalitesPublication,
    planRelance: declaration.planRelance !== undefined ? parseBooleanStateValue(declaration.planRelance) : undefined,
  }

  const saveForm = (formData: any) => {
    const {
      mesuresCorrection,
      cseMisEnPlace,
      dateConsultationCSE,
      datePublication,
      publicationSurSiteInternet,
      lienPublication,
      modalitesPublication,
      planRelance,
    } = formData

    updateDeclaration({
      mesuresCorrection,
      cseMisEnPlace: cseMisEnPlace !== undefined ? parseBooleanFormValue(cseMisEnPlace) : undefined,
      dateConsultationCSE,
      datePublication,
      publicationSurSiteInternet:
        publicationSurSiteInternet !== undefined ? parseBooleanFormValue(publicationSurSiteInternet) : undefined,
      lienPublication,
      modalitesPublication,
      planRelance: parseBooleanFormValue(planRelance),
    })
  }

  const onSubmit = (formData: typeof initialValues) => {
    saveForm(formData)
    validateDeclaration("Valid")
  }

  const after2020 = Boolean(state.informations.anneeDeclaration && state.informations.anneeDeclaration >= 2020)
  const after2021 = Boolean(state.informations.anneeDeclaration && state.informations.anneeDeclaration >= 2021)

  const displayNC = noteIndex === undefined && after2020 ? " aux indicateurs calculables" : ""

  const isUES = Boolean(state.informationsEntreprise.nomUES)

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(undefined)

  const onClick = () => {
    setLoading(true)

    resendReceipt(state.informationsEntreprise.siren, state.informations.anneeDeclaration)
      .then(() => {
        setLoading(false)
      })
      .catch((error) => {
        setLoading(false)
        const errorMessage =
          (error.jsonBody && error.jsonBody.message) || "Erreur lors du renvoi de l'accusé de réception"
        setErrorMessage(errorMessage)
        logToSentry(error, undefined)
      })
  }

  if (!loading && errorMessage) {
    return ErrorMessage(errorMessage)
  }

  return (
    <Form
      onSubmit={onSubmit}
      validate={validateForm({ finPeriodeReference, anneeDeclaration })}
      initialValues={initialValues}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ handleSubmit, values, hasValidationErrors, submitFailed }) => (
        <form onSubmit={handleSubmit}>
          <FormAutoSave saveForm={saveForm} />
          <FormStack mt={6}>
            {noteIndex !== undefined && noteIndex < 75 && (
              <MesuresCorrection
                label="Mesures de correction prévues à l'article D. 1142-6"
                name="mesuresCorrection"
                readOnly={readOnly}
              />
            )}
            {!indicateurUnParCSP && (
              <>
                {state.informationsEntreprise.structure === "Entreprise" && (
                  <RadiosBoolean
                    fieldName="cseMisEnPlace"
                    value={values.cseMisEnPlace}
                    readOnly={readOnly}
                    label="Un CSE a-t-il été mis en place ?"
                  />
                )}
                {(state.informationsEntreprise.structure !== "Entreprise" || values.cseMisEnPlace === "true") && (
                  <InputDateGroup
                    fieldName="dateConsultationCSE"
                    label="Date de consultation du CSE pour l’indicateur relatif à l’écart de rémunération"
                    isReadOnly={readOnly}
                  />
                )}
              </>
            )}

            {(noteIndex !== undefined || after2020) && (
              <>
                <InputDateGroup
                  fieldName="datePublication"
                  label={
                    after2020
                      ? `Date de publication des résultats obtenus${displayNC}`
                      : "Date de publication du niveau de résultat obtenu"
                  }
                  isReadOnly={readOnly}
                />
                <RadiosBoolean
                  fieldName="publicationSurSiteInternet"
                  value={values.publicationSurSiteInternet}
                  readOnly={readOnly}
                  label={
                    after2020
                      ? `Avez-vous un site Internet pour publier les résultats obtenus${displayNC} ?`
                      : "Avez-vous un site Internet pour publier le niveau de résultat obtenu ?"
                  }
                />

                {values.publicationSurSiteInternet !== undefined &&
                  (values.publicationSurSiteInternet === "true" ? (
                    <InputGroup
                      label={
                        after2020
                          ? `Indiquer l'adresse exacte de la page Internet (URL) sur laquelle seront publiés les résultats obtenus${displayNC}`
                          : "Indiquer l'adresse exacte de la page Internet (URL) sur laquelle sera publié le niveau de résultat obtenu"
                      }
                      fieldName="lienPublication"
                      message={{ error: "Veuillez entrer une adresse internet" }}
                      isReadOnly={readOnly}
                    />
                  ) : (
                    <TextareaGroup
                      label={
                        after2020
                          ? `Préciser les modalités de communication des résultats obtenus${displayNC} auprès de vos salariés`
                          : "Préciser les modalités de communication du niveau de résultat obtenu auprès de vos salariés"
                      }
                      fieldName="modalitesPublication"
                      message={{ error: "Veuillez préciser les modalités de communication" }}
                      isReadOnly={readOnly}
                    />
                  ))}
              </>
            )}
            {after2021 && <FieldPlanRelance readOnly={readOnly} after2021={after2021} isUES={isUES} />}
          </FormStack>
          {readOnly ? (
            <>
              <ActionBar>
                Votre déclaration est maintenant finalisée, en date du {declaration.dateDeclaration}. &emsp;
                {declaration.formValidated === "Valid" && (
                  <ActionLink onClick={() => validateDeclaration("None")}>Modifier les données saisies</ActionLink>
                )}
              </ActionBar>
              <ButtonAction
                onClick={onClick}
                label="Renvoyer l'accusé de réception"
                disabled={loading}
                loading={loading}
              />
              <ButtonAction
                onClick={resetDeclaration}
                label="Effectuer une nouvelle simulation et déclaration"
                disabled={loading}
                loading={loading}
              />
            </>
          ) : (
            <ActionBar>
              <FormSubmit
                hasValidationErrors={hasValidationErrors || Boolean(apiError)}
                submitFailed={submitFailed || Boolean(apiError)}
                errorMessage={
                  apiError || "Le formulaire ne peut pas être validé si tous les champs ne sont pas remplis."
                }
                label="Déclarer"
                loading={declaring}
              />
            </ActionBar>
          )}
        </form>
      )}
    </Form>
  )
}

const FieldPlanRelance = ({
  readOnly,
  after2021,
  isUES,
}: {
  readOnly: boolean
  after2021: boolean
  isUES: boolean
}) => {
  const field = useField("planRelance", { validate })
  const error = hasFieldError(field.meta)

  if (!after2021) return null

  return (
    <>
      <RadiosBoolean
        fieldName="planRelance"
        value={field.input.value}
        readOnly={readOnly}
        label={
          isUES
            ? `Une ou plusieurs entreprises comprenant au moins 50 salariés au sein de l’UES a-t-elle bénéficié, en 2021
              et/ou 2022, d’une aide prévue par la loi du 29 décembre 2020 de finances pour 2021 au titre de la mission
              « Plan de relance »&nbsp;?`
            : `
              Avez-vous bénéficié, en 2021 et/ou 2022, d’une aide prévue par la loi du 29 décembre 2020 de finances pour
              2021 au titre de la mission « Plan de relance »&nbsp;?`
        }
      />
      <p>{error && displayMetaErrors(field.meta.error)}</p>
    </>
  )
}

export default DeclarationForm
