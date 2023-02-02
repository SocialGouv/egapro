import { Box, Divider, Text } from "@chakra-ui/react"
import React, { FunctionComponent, useState } from "react"
import { Form } from "react-final-form"
import { useHistory } from "react-router-dom"

import { FormState } from "../../globals"
import { resendReceipt } from "../../utils/api"
import { parseDate } from "../../utils/date"
import { isFormValid, parseBooleanFormValue, parseBooleanStateValue } from "../../utils/formHelpers"
import { logToSentry } from "../../utils/sentry"

import { getYear } from "date-fns"
import ActionBar from "../../components/ActionBar"
import ButtonAction from "../../components/ds/ButtonAction"
import FormStack from "../../components/ds/FormStack"
import { IconEdit } from "../../components/ds/Icons"
import InfoBlock from "../../components/ds/InfoBlock"
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
import RequiredRadiosBoolean from "../../components/RequiredRadiosBoolean"
import { FIRST_YEAR_FOR_DECLARATION } from "../../config"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import { estCalculable } from "../../utils/helpers"
import { frozenDeclarationMessage } from "../../components/MessageForFrozenDeclaration"
import { isFrozenDeclaration } from "../../utils/isFrozenDeclaration"

// NB : some fields (like RadioButton Oui/Non) are only validated at field-level.
const validateForm = ({
  finPeriodeReference,
  periodeSuffisante,
}: {
  finPeriodeReference: string | undefined
  periodeSuffisante: boolean | undefined
}) => {
  return ({ datePublication, dateConsultationCSE }: { datePublication: string; dateConsultationCSE: string }) => {
    // No validation at all, if periodeSuffisante is false.
    if (!periodeSuffisante) return
    const parsedDatePublication = parseDate(datePublication)
    const parsedFinPeriodeReference = finPeriodeReference ? parseDate(finPeriodeReference) : undefined
    const parsedDateCSE = parseDate(dateConsultationCSE) ? parseDate(dateConsultationCSE) : undefined

    return {
      datePublication:
        parsedDatePublication !== undefined &&
        parsedFinPeriodeReference !== undefined &&
        parsedDatePublication > parsedFinPeriodeReference
          ? undefined
          : {
              correspondanceFinPeriodeReference: `La date ne peut précéder la date de fin de la période de référence (${finPeriodeReference})`,
            },
      dateConsultationCSE:
        parsedDateCSE && getYear(parsedDateCSE) < FIRST_YEAR_FOR_DECLARATION
          ? {
              invalidDate: `La date de consultation du CSE doit être postérieure ou égale à ${FIRST_YEAR_FOR_DECLARATION}`,
            }
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
  noteIndex: number | undefined
  validateDeclaration: (valid: FormState) => void
  declaring: boolean
}

const DeclarationForm: FunctionComponent<DeclarationFormProps> = ({ noteIndex, validateDeclaration, declaring }) => {
  const history = useHistory()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(undefined)

  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const declaration = state.declaration
  const estCalculableIndex = estCalculable(noteIndex)
  const indicateurUnParCSP = state.indicateurUn.csp
  const finPeriodeReference = state.informations.finPeriodeReference
  const periodeSuffisante = state.informations.periodeSuffisante
  const readOnly = isFormValid(state.declaration) && !declaring
  const after2020 = Boolean(state.informations.anneeDeclaration && state.informations.anneeDeclaration >= 2020)
  const after2021 = Boolean(state.informations.anneeDeclaration && state.informations.anneeDeclaration >= 2021)
  const displayNC = !estCalculableIndex && after2020 ? " aux indicateurs calculables" : ""
  const isUES = Boolean(state.informationsEntreprise.structure !== "Entreprise")

  const frozenDeclaration = isFrozenDeclaration(state)

  const resetDeclaration = () => {
    history.push(`/nouvelle-simulation`)
  }

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
    dispatch({
      type: "updateDeclaration",
      data: {
        mesuresCorrection,
        cseMisEnPlace: cseMisEnPlace !== undefined ? parseBooleanFormValue(cseMisEnPlace) : undefined,
        dateConsultationCSE,
        datePublication,
        publicationSurSiteInternet:
          publicationSurSiteInternet !== undefined ? parseBooleanFormValue(publicationSurSiteInternet) : undefined,
        lienPublication,
        modalitesPublication,
        planRelance: parseBooleanFormValue(planRelance),
      },
    })
  }

  function onSubmit(formData: typeof initialValues) {
    saveForm(formData)
    validateDeclaration("Valid")
  }

  async function onClick() {
    setLoading(true)

    try {
      if (!state) throw new Error("State is undefined")

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
      validate={validateForm({ finPeriodeReference, periodeSuffisante })}
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

            {periodeSuffisante && (
              <>
                {estCalculableIndex && noteIndex < 75 && (
                  // MesuresCorrection has its own validation at the component level.
                  <MesuresCorrection readOnly={readOnly} />
                )}
                {!indicateurUnParCSP && (
                  <>
                    {state.informationsEntreprise.structure === "Entreprise" && (
                      <RequiredRadiosBoolean
                        fieldName="cseMisEnPlace"
                        readOnly={readOnly}
                        value={values.cseMisEnPlace}
                        label="Un CSE a-t-il été mis en place&nbsp;?"
                      />
                    )}
                    {(state.informationsEntreprise.structure !== "Entreprise" || values.cseMisEnPlace === "true") && (
                      //  InputDateGroup has its own validation at the component level.
                      <InputDateGroup
                        fieldName="dateConsultationCSE"
                        label="Date de consultation du CSE pour le choix de la modalité de calcul de l’indicateur Ecart de rémunération"
                        isReadOnly={readOnly}
                      />
                    )}
                  </>
                )}
                {/* Show publication data only if if index is calculable for cases before 2020 and for all index (even non calculable) after. */}
                {(estCalculableIndex || after2020) && (
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
                    <RequiredRadiosBoolean
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
                {/* FieldPlanRelance has its own validation at the component level. */}
                {after2021 && <FieldPlanRelance readOnly={readOnly} isUES={isUES} />}
              </>
            )}

            {readOnly && (
              <InfoBlock
                type="info"
                title="Vous venez de transmettre aux services du ministre chargé du travail vos indicateurs et votre niveau de résultat en matière d’écart de rémunération entre les femmes et les hommes conformément aux dispositions de l’article D.1142-5 du code du travail."
                text={
                  <>
                    <Text mt={2}>
                      Vous allez recevoir un accusé de réception de votre transmission sur l'email que vous avez déclaré
                      et validé précédemment. Cet accusé de réception contient un lien vous permettant de revenir sur
                      votre simulation et déclaration.
                    </Text>
                    <Text mt={2}>
                      Si vous ne recevez pas cet accusé de réception, merci de bien vérifier que celui-ci n'a pas été
                      déplacé dans votre dossier de courriers indésirables.
                    </Text>
                  </>
                }
              />
            )}
          </FormStack>
          {readOnly ? (
            <>
              {isFormValid(declaration) && (
                <ButtonAction
                  leftIcon={<IconEdit />}
                  label="Modifier les données saisies"
                  onClick={() => validateDeclaration("None")}
                  variant="link"
                  size="sm"
                  mt="4"
                  disabled={frozenDeclaration}
                  title={frozenDeclaration ? frozenDeclarationMessage : ""}
                />
              )}

              {/* Objectifs de progression et mesures de correction */}
              {after2021 && periodeSuffisante && estCalculableIndex && noteIndex < 85 && (
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
              <Divider my="8" />
              <Box>
                <Text fontWeight="bold">Aidez-nous à améliorer cette démarche</Text>
                <Text mb="4">Donnez-nous votre avis, cela ne prend que 2 minutes.</Text>
                <a href="https://jedonnemonavis.numerique.gouv.fr/Demarches/2240?&view-mode=formulaire-avis&nd_source=button-calcul-declaration&key=73366ddb13d498f4c77d01c2983bab48">
                  <img src="https://jedonnemonavis.numerique.gouv.fr/static/bouton-bleu.svg" alt="Je donne mon avis" />
                </a>
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

export default DeclarationForm
