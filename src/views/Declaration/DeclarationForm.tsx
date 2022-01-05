/** @jsx jsx */
import { Fragment, useState } from "react"
import { css, jsx } from "@emotion/react"
import { Form, useField } from "react-final-form"

import { AppState, FormState, ActionDeclarationData } from "../../globals"

import ActionBar from "../../components/ActionBar"
import ActionLink from "../../components/ActionLink"
import FieldDate from "../../components/FieldDate"
import FormAutoSave from "../../components/FormAutoSave"
import FormSubmit from "../../components/FormSubmit"
import Textarea from "../../components/Textarea"
import MesuresCorrection from "../../components/MesuresCorrection"
import { logToSentry, parseDate } from "../../utils/helpers"
import RadiosBoolean from "../../components/RadiosBoolean"
import { parseBooleanFormValue, parseBooleanStateValue, required } from "../../utils/formHelpers"
import Input, { hasFieldError } from "../../components/Input"
import globalStyles from "../../utils/globalStyles"
import ButtonAction from "../../components/ButtonAction"
import ErrorMessage from "../../components/ErrorMessage"
import { resendReceipt } from "../../utils/api"

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

const validateForm = (finPeriodeReference: string) => {
  return ({
    datePublication,
    publicationSurSiteInternet,
  }: {
    datePublication: string
    publicationSurSiteInternet: string | undefined
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
    }
  }
}

///////////////////
interface Props {
  state: AppState
  noteIndex: number | undefined
  indicateurUnParCSP: boolean
  finPeriodeReference: string
  readOnly: boolean
  updateDeclaration: (data: ActionDeclarationData) => void
  validateDeclaration: (valid: FormState) => void
  apiError: string | undefined
  declaring: boolean
}

function DeclarationForm({
  state,
  noteIndex,
  indicateurUnParCSP,
  finPeriodeReference,
  readOnly,
  updateDeclaration,
  validateDeclaration,
  apiError,
  declaring,
}: Props) {
  const declaration = state.declaration
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
    })
  }

  const onSubmit = (formData: any) => {
    saveForm(formData)
    validateDeclaration("Valid")
  }

  const after2020 = Boolean(state.informations.anneeDeclaration && state.informations.anneeDeclaration >= 2020)
  const displayNC = noteIndex === undefined && after2020 ? " aux indicateurs calculables" : ""

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
      validate={validateForm(finPeriodeReference)}
      initialValues={initialValues}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ handleSubmit, values, hasValidationErrors, errors, submitFailed }) => (
        <form onSubmit={handleSubmit} css={styles.container} style={{ marginTop: 20 }}>
          <FormAutoSave saveForm={saveForm} />

          {noteIndex !== undefined && noteIndex < 75 && (
            <MesuresCorrection
              label="Mesures de correction prévues à l'article D. 1142-6"
              name="mesuresCorrection"
              readOnly={readOnly}
            />
          )}

          {!indicateurUnParCSP && (
            <Fragment>
              {state.informationsEntreprise.structure === "Entreprise" && (
                <div css={styles.formField}>
                  Un CSE a-t-il été mis en place ?
                  <RadiosBoolean
                    fieldName="cseMisEnPlace"
                    value={values.cseMisEnPlace}
                    readOnly={readOnly}
                    labelTrue="oui"
                    labelFalse="non"
                  />
                </div>
              )}
              {(state.informationsEntreprise.structure !== "Entreprise" || values.cseMisEnPlace === "true") && (
                <div>
                  <FieldDate
                    name="dateConsultationCSE"
                    label="Date de consultation du CSE pour l’indicateur relatif à l’écart de rémunération"
                    readOnly={readOnly}
                  />
                </div>
              )}
            </Fragment>
          )}

          {(noteIndex !== undefined || after2020) && (
            <Fragment>
              <FieldDate
                name="datePublication"
                label={
                  after2020
                    ? `Date de publication des résultats obtenus${displayNC}`
                    : "Date de publication du niveau de résultat obtenu"
                }
                readOnly={readOnly}
              />
              <p>
                {after2020
                  ? `Avez-vous un site Internet pour publier les résultats obtenus${displayNC} ?`
                  : "Avez-vous un site Internet pour publier le niveau de résultat obtenu ?"}
              </p>
              <RadiosBoolean
                fieldName="publicationSurSiteInternet"
                value={values.publicationSurSiteInternet}
                readOnly={readOnly}
                labelTrue="oui"
                labelFalse="non"
              />
              {submitFailed && hasValidationErrors && errors && errors.publicationSurSiteInternet && (
                <p css={styles.error}>{errors.publicationSurSiteInternet}</p>
              )}
              <div css={styles.siteOrModalites}>
                {values.publicationSurSiteInternet !== undefined &&
                  (values.publicationSurSiteInternet === "true" ? (
                    <FieldSiteInternet readOnly={readOnly} after2020={after2020} displayNC={displayNC} />
                  ) : (
                    <Textarea
                      label={
                        after2020
                          ? `Préciser les modalités de communication des résultats obtenus${displayNC} auprès de vos salariés`
                          : "Préciser les modalités de communication du niveau de résultat obtenu auprès de vos salariés"
                      }
                      fieldName="modalitesPublication"
                      errorText="Veuillez préciser les modalités de communication"
                      readOnly={readOnly}
                    />
                  ))}
              </div>
            </Fragment>
          )}

          {readOnly ? (
            <Fragment>
              <ActionBar>
                Votre déclaration est maintenant finalisée, en date du {declaration.dateDeclaration}. &emsp;
                {declaration.formValidated === "Valid" && (
                  <p css={styles.edit}>
                    <ActionLink onClick={() => validateDeclaration("None")}>modifier les données saisies</ActionLink>
                  </p>
                )}
              </ActionBar>
              <ButtonAction
                onClick={onClick}
                label="Renvoyer l'accusé de réception"
                disabled={loading}
                loading={loading}
              />
            </Fragment>
          ) : (
            <ActionBar>
              <FormSubmit
                hasValidationErrors={hasValidationErrors || Boolean(apiError)}
                submitFailed={submitFailed || Boolean(apiError)}
                errorMessage={
                  apiError || "Le formulaire ne peut pas être validé si tous les champs ne sont pas remplis."
                }
                label="déclarer"
                loading={declaring}
              />
            </ActionBar>
          )}
        </form>
      )}
    </Form>
  )
}

function FieldSiteInternet({
  readOnly,
  after2020,
  displayNC,
}: {
  readOnly: boolean
  after2020: boolean
  displayNC: string
}) {
  const field = useField("lienPublication", { validate })
  const error = hasFieldError(field.meta)

  return (
    <div css={styles.formField}>
      <label css={[styles.label, error && styles.labelError]} htmlFor={field.input.name}>
        {after2020
          ? `Indiquer l'adresse exacte de la page Internet (URL) sur laquelle seront publiés les résultats obtenus${displayNC}`
          : "Indiquer l'adresse exacte de la page Internet (URL) sur laquelle sera publié le niveau de résultat obtenu"}
      </label>
      <div css={styles.fieldRow}>
        <Input field={field} readOnly={readOnly} />
      </div>
      <p css={styles.error}>{error && "veuillez entrer une adresse internet"}</p>
    </div>
  )
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
  }),
  formField: css({
    marginBottom: 20,
  }),
  label: css({
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: "17px",
  }),
  labelError: css({
    color: globalStyles.colors.error,
  }),
  siteOrModalites: css({
    marginTop: 20,
  }),
  fieldRow: css({
    height: 38,
    marginTop: 5,
    marginBottom: 5,
    display: "flex",
    input: {
      borderRadius: 4,
      border: "1px solid",
    },
    "input[readonly]": { border: 0 },
  }),
  edit: css({
    marginTop: 14,
    marginBottom: 14,
    textAlign: "center",
  }),
  error: css({
    color: globalStyles.colors.error,
    fontSize: 12,
    textDecoration: "underline",
    lineHeight: "15px",
  }),
}

export default DeclarationForm
