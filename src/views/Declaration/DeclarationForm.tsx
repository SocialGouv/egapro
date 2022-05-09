import React, { FunctionComponent, useState } from "react"
import { Form, useField } from "react-final-form"
import { Box, Text } from "@chakra-ui/react"

import { AppState, FormState, ActionDeclarationData } from "../../globals"
import { resendReceipt } from "../../utils/api"
import { displayMetaErrors } from "../../utils/form-error-helpers"
import { isFormValid, parseBooleanFormValue, parseBooleanStateValue, required } from "../../utils/formHelpers"
import { logToSentry, parseDate } from "../../utils/helpers"

import InputDateGroup from "../../components/ds/InputDateGroup"
import ActionBar from "../../components/ActionBar"
import ButtonAction from "../../components/ds/ButtonAction"
import FormStack from "../../components/ds/FormStack"
import TextareaGroup from "../../components/ds/TextareaGroup"
import InputGroup from "../../components/ds/InputGroup"
import { IconEdit } from "../../components/ds/Icons"
import FormAutoSave from "../../components/FormAutoSave"
import FormSubmit from "../../components/FormSubmit"
import MesuresCorrection from "../../components/MesuresCorrection"
import RadiosBoolean from "../../components/RadiosBoolean"
import ErrorMessage from "../../components/ErrorMessage"
import { hasFieldError } from "../../components/Input"
import FormError from "../../components/FormError"

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
  periodeSuffisante,
}: {
  finPeriodeReference: string | undefined
  anneeDeclaration: number | undefined
  periodeSuffisante: boolean | undefined
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
    if (!datePublication || !periodeSuffisante) return
    const parsedDatePublication = parseDate(datePublication)
    const parsedFinPeriodeReference = finPeriodeReference ? parseDate(finPeriodeReference) : undefined

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
  const periodeSuffisante = state.informations.periodeSuffisante
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
      validate={validateForm({ finPeriodeReference, anneeDeclaration, periodeSuffisante })}
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
            {((submitFailed && hasValidationErrors) || Boolean(apiError)) && (
              <FormError message="Le formulaire ne peut pas être validé si tous les champs ne sont pas remplis." />
            )}
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
                    label={<>Un CSE a-t-il été mis en place&nbsp;?</>}
                  />
                )}
                {(state.informationsEntreprise.structure !== "Entreprise" || values.cseMisEnPlace === "true") && (
                  <InputDateGroup
                    fieldName="dateConsultationCSE"
                    label="Date de consultation du CSE pour l'indicateur relatif à l'écart de rémunération"
                    isReadOnly={readOnly}
                  />
                )}
              </>
            )}

            {state.informations.periodeSuffisante && (
              <>
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
                        after2020 ? (
                          <>Avez-vous un site Internet pour publier les résultats obtenus {displayNC}&nbsp;?</>
                        ) : (
                          <>Avez-vous un site Internet pour publier le niveau de résultat obtenu&nbsp;?</>
                        )
                      }
                    />

                    {values.publicationSurSiteInternet !== undefined &&
                      (values.publicationSurSiteInternet === "true" ? (
                        <InputGroup
                          label={
                            after2020
                              ? `Indiquer l'adresse exacte de la page Internet (URL) sur laquelle seront publiés les résultats obtenus ${displayNC}`
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
              </>
            )}
            {readOnly && (
              <Text fontSize="sm" fontWeight="bold">
                Votre déclaration est maintenant finalisée, en date du {declaration.dateDeclaration}
              </Text>
            )}
          </FormStack>
          {readOnly ? (
            <>
              <ActionBar>
                <ButtonAction
                  onClick={onClick}
                  label="Renvoyer l'accusé de réception"
                  disabled={loading}
                  loading={loading}
                  variant="outline"
                />
                {declaration.formValidated === "Valid" && (
                  <ButtonAction
                    leftIcon={<IconEdit />}
                    label="Modifier les données saisies"
                    onClick={() => validateDeclaration("None")}
                    variant="link"
                    size="sm"
                  />
                )}
              </ActionBar>
              <Box mt={6}>
                <ButtonAction
                  onClick={resetDeclaration}
                  size="lg"
                  label="Effectuer une nouvelle simulation et déclaration"
                  disabled={loading}
                  loading={loading}
                />
              </Box>
            </>
          ) : (
            <ActionBar>
              <FormSubmit label="Déclarer" loading={declaring} />
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
          isUES ? (
            <>
              Une ou plusieurs entreprises comprenant au moins 50 salariés au sein de l'UES a-t-elle bénéficié, en 2021
              et/ou 2022, d'une aide prévue par la loi du 29 décembre 2020 de finances pour 2021 au titre de la mission
              « Plan de relance »&nbsp;?
            </>
          ) : (
            <>
              Avez-vous bénéficié, en 2021 et/ou 2022, d'une aide prévue par la loi du 29 décembre 2020 de finances pour
              2021 au titre de la mission « Plan de relance »&nbsp;?
            </>
          )
        }
      />
      <p>{error && displayMetaErrors(field.meta.error)}</p>
    </>
  )
}

export default DeclarationForm
