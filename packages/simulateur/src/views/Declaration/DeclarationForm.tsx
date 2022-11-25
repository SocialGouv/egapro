import { Box, Divider, Text } from "@chakra-ui/react"
import React, { FunctionComponent, useState } from "react"
import { Form } from "react-final-form"
import { useHistory } from "react-router-dom"

import { ActionDeclarationData, AppState, FormState } from "../../globals"
import { resendReceipt } from "../../utils/api"
import { parseDate } from "../../utils/date"
import { isFormValid, parseBooleanFormValue, parseBooleanStateValue } from "../../utils/formHelpers"
import { logToSentry } from "../../utils/sentry"

import ActionBar from "../../components/ActionBar"
import ButtonAction from "../../components/ds/ButtonAction"
import FormStack from "../../components/ds/FormStack"
import { IconEdit } from "../../components/ds/Icons"
import InputDateGroup from "../../components/ds/InputDateGroup"
import InputGroup from "../../components/ds/InputGroup"
import LegalText from "../../components/ds/LegalText"
import TextareaGroup from "../../components/ds/TextareaGroup"
import ErrorMessage from "../../components/ErrorMessage"
import FieldPlanRelance from "../../components/FieldPlanRelance"
import FormAutoSave from "../../components/FormAutoSave"
import FormError from "../../components/FormError"
import FormSubmit from "../../components/FormSubmit"
import MesuresCorrection from "../../components/MesuresCorrection"
import RadiosBoolean from "../../components/RadiosBoolean"
import { estCalculable } from "../../utils/helpers"

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
              correspondanceFinPeriodeReference: `La date ne peut précéder la date de fin de la période de référence (${finPeriodeReference})`,
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

function buildWordings(index: number | undefined) {
  const legalText =
    !estCalculable(index) || index > 85
      ? ""
      : index < 75
      ? "Conformément à l’article 13 de la loi n° 2021-1774 du 24 décembre 2021 visant à accélérer l’égalité économique et professionnelle et au décret n° 2022-243 du 25 février 2022, les entreprises ayant obtenu un Index inférieur à 75 points doivent publier, par une communication externe et au sein de l’entreprise, les mesures de correction qu’elles ont définies par accord ou, à défaut, par décision unilatérale. Par ailleurs, celles ayant obtenu un Index inférieur à 85 points doivent fixer, également par accord ou, à défaut, par décision unilatérale, et publier des objectifs de progression de chacun des indicateurs de l’Index. Une fois l’accord ou la décision déposé, les informations relatives aux mesures de correction, les objectifs de progression ainsi que leurs modalités de publication doivent être transmis aux services du ministre chargé du travail et au comité social et économique."
      : "Conformément à l’article 13 de la loi n° 2021-1774 du 24 décembre 2021 visant à accélérer l’égalité économique et professionnelle et au décret n° 2022-243 du 25 février 2022, les entreprises ayant obtenu un Index inférieur à 85 points doivent fixer par accord ou, à défaut, par décision unilatérale, et publier des objectifs de progression de chacun des indicateurs de l’Index. Une fois l’accord ou la décision déposé, les objectifs de progression ainsi que leurs modalités de publication doivent être transmis aux services du ministre chargé du travail et au comité social et économique."

  const buttonLabel =
    !estCalculable(index) || index > 85
      ? ""
      : index < 75
      ? "Déclarer les objectifs de progression et les mesures de correction maintenant"
      : "Déclarer les objectifs de progression maintenant"

  return { legalText, buttonLabel }
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
  const history = useHistory()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(undefined)

  const declaration = state.declaration
  const indicateurUnParCSP = state.indicateurUn.csp
  const finPeriodeReference = state.informations.finPeriodeReference
  const periodeSuffisante = state.informations.periodeSuffisante
  const anneeDeclaration = state.informations.anneeDeclaration
  const readOnly = isFormValid(state.declaration) && !declaring
  const after2020 = Boolean(state.informations.anneeDeclaration && state.informations.anneeDeclaration >= 2020)
  const after2021 = Boolean(state.informations.anneeDeclaration && state.informations.anneeDeclaration >= 2021)
  const displayNC = !estCalculable(noteIndex) && after2020 ? " aux indicateurs calculables" : ""
  const isUES = Boolean(state.informationsEntreprise.structure !== "Entreprise")

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

  const { legalText, buttonLabel } = buildWordings(noteIndex)

  function saveForm({
    mesuresCorrection,
    cseMisEnPlace,
    dateConsultationCSE,
    datePublication,
    publicationSurSiteInternet,
    lienPublication,
    modalitesPublication,
    planRelance,
  }: typeof initialValues) {
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

  function onSubmit(formData: typeof initialValues) {
    saveForm(formData)
    validateDeclaration("Valid")
  }

  async function onClick() {
    setLoading(true)

    try {
      // TODO : state.informations.anneeDeclaration may be undefined in TS. That seems not good because the endpoint expects a year.
      await resendReceipt(state.informationsEntreprise.siren, state.informations.anneeDeclaration)
      setLoading(false)
    } catch (error: any) {
      setLoading(false)
      const errorMessage = error.jsonBody?.message || "Erreur lors du renvoi de l'accusé de réception"
      setErrorMessage(errorMessage)
      logToSentry(error, undefined)
    }
  }

  if (!loading && errorMessage) {
    return <ErrorMessage>{errorMessage}</ErrorMessage>
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
            {submitFailed && hasValidationErrors && (
              <FormError message="Le formulaire ne peut pas être validé si tous les champs ne sont pas remplis." />
            )}
            {Boolean(apiError) && <FormError message={apiError || "Erreur lors de la sauvegarde des données."} />}

            {periodeSuffisante && (
              <>
                {estCalculable(noteIndex) && noteIndex < 75 && (
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
                {/* Show publication data only if if index is calculable for cases before 2020 and for all index (even non calculable) after. */}
                {(estCalculable(noteIndex) || after2020) && (
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

                    {values.publicationSurSiteInternet === "true" && (
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
                    )}

                    {values.publicationSurSiteInternet === "false" && (
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
                    )}
                  </>
                )}
                {after2021 && <FieldPlanRelance readOnly={readOnly} isUES={isUES} />}
              </>
            )}

            {readOnly && (
              <Text fontWeight="bold">
                Votre déclaration est maintenant finalisée, en date du {declaration.dateDeclaration}.
              </Text>
            )}
          </FormStack>
          {readOnly ? (
            <>
              {declaration.formValidated === "Valid" && (
                <ButtonAction
                  leftIcon={<IconEdit />}
                  label="Modifier les données saisies"
                  onClick={() => validateDeclaration("None")}
                  variant="link"
                  size="sm"
                  mt="4"
                />
              )}

              {/* Objectifs de progression et mesures de correction */}
              {after2021 && periodeSuffisante && estCalculable(noteIndex) && noteIndex < 85 && (
                <Box my="4">
                  <Divider mt="8" mb="4" />
                  <LegalText>{legalText}</LegalText>

                  <ButtonAction
                    label={buttonLabel}
                    onClick={() =>
                      history.push(`/tableauDeBord/mes-declarations/${state.informationsEntreprise.siren}`)
                    }
                    mt="8"
                  />
                  <Text mt="8">
                    Si vous souhaitez les déclarer ultérieurement, vous pouvez vous connecter à votre espace et aller
                    sur "Mes déclarations"
                  </Text>
                </Box>
              )}

              <ActionBar>
                <ButtonAction
                  onClick={onClick}
                  label="Renvoyer l'accusé de réception"
                  disabled={loading}
                  loading={loading}
                  variant="outline"
                />
                <ButtonAction
                  onClick={resetDeclaration}
                  label="Effectuer une nouvelle simulation et déclaration"
                  disabled={loading}
                  loading={loading}
                />
              </ActionBar>
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

export default DeclarationForm
