import React, { FunctionComponent } from "react"
import { Text, GridItem, Grid } from "@chakra-ui/react"
import { Form } from "react-final-form"
import { z } from "zod"

import { AppState, ActionInformationsComplementairesData, TrancheEffectifs } from "../../globals"

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
import { computeValuesFromState } from "../../utils/helpers"
import FakeInputGroup from "../../components/ds/FakeInputGroup"
import MesuresCorrection from "../../components/MesuresCorrection"
import InputDateGroup from "../../components/ds/InputDateGroup"
import { MAX_NOTES_INDICATEURS } from "../../utils/calculsEgaProIndex"
import RadiosBoolean from "../../components/RadiosBoolean"
import { dateToString, parseDate } from "../../utils/date"
import { FormInputs, parseBooleanFormValue } from "../../utils/formHelpers"

const required_error = "Requis"
const invalid_type_error = (min = 0, max: number) => `L'objectif doit être un nombre entre ${min} et ${max}`

/**
 * Zod validator for an objective indicator .
 *
 * @param originValue The actual value for this indicator.
 * @param max The maximum value for this in ddicator.
 * @param nonCalculable If true, the value is not calculable.
 */
const objectifValidator = (originValue = 0, max: number, nonCalculable = false) =>
  nonCalculable || originValue === max
    ? z.undefined()
    : z
        .string({
          required_error,
        })
        .nonempty({ message: required_error })
        .refine((value) => Number(value) >= originValue && Number(value) <= max, {
          message: invalid_type_error(originValue, max),
        })

/**
 * Zod validator in relation to the publication dates and the end of reference period.
 */
const isDateBeforeFinPeriodeReference = (finPeriodeReference: Date | undefined) =>
  z.string().refine(
    (value) => {
      if (!finPeriodeReference) return true
      const parsedDatePublication = parseDate(value)
      return parsedDatePublication !== undefined && parsedDatePublication > finPeriodeReference
    },
    {
      message: `La date ne peut précéder la fin de la période de référence (${dateToString(finPeriodeReference)})`,
    },
  )

interface InformationsComplementairesFormProps {
  state: AppState
  dispatch: React.Dispatch<any>
  readOnly: boolean
}

type RowProgressionProps = {
  children: string
  valueOrigin: string
  fieldName: string
  isReadOnly: boolean
  isDisabled: boolean
  min: number | undefined
  max: number
}

const RowProgression: FunctionComponent<RowProgressionProps> = ({
  children,
  valueOrigin,
  fieldName,
  isReadOnly = false,
  isDisabled = false,
  min = 0,
  max,
}) => {
  return (
    <Grid templateColumns="250px 75px 75px" templateRows="1fr 2fr" gap={2} alignItems="center">
      <GridItem />
      <GridItem>
        <Text fontSize="sm" textAlign="center">
          Actuel
        </Text>
      </GridItem>
      <GridItem textAlign="center">
        <Text fontSize="sm">Objectif&nbsp;*</Text>
      </GridItem>
      <GridItem>
        <Text>{children}</Text>
      </GridItem>
      <GridItem>
        <FakeInputGroup label="" textAlign="center">
          {valueOrigin}
        </FakeInputGroup>
      </GridItem>
      <GridItem>
        <InputGroup
          label=""
          fieldName={fieldName}
          isReadOnly={isReadOnly}
          isDisabled={isDisabled}
          textAlign="center"
          type="number"
          min={min}
          max={max}
          showError={false}
        />
      </GridItem>
    </Grid>
  )
}

const InformationsComplementairesForm: FunctionComponent<InformationsComplementairesFormProps> = ({
  state,
  dispatch,
  readOnly,
}) => {
  // If formValidated is included in form, FormAutoSave as weird behavior... So we need to exclude it here.
  const { formValidated, publicationSurSiteInternet, ...restInformationsComplementaires } =
    state.informationsComplementaires

  const initialValues = {
    publicationSurSiteInternet: String(publicationSurSiteInternet),
    ...restInformationsComplementaires,
  }

  const saveForm = (data: FormInputs<ActionInformationsComplementairesData>) => {
    console.log("dans saveForm")
    const { publicationSurSiteInternet, ...restData } = data

    dispatch({
      type: "updateInformationsComplementaires",
      data: {
        publicationSurSiteInternet: parseBooleanFormValue(publicationSurSiteInternet),
        ...restData,
        lienPublication: publicationSurSiteInternet === "false" ? "" : data.lienPublication,
        modalitesPublication: publicationSurSiteInternet === "true" ? "" : data.modalitesPublication,
      },
    })
  }

  const onSubmit = (formData: FormInputs<ActionInformationsComplementairesData>) => {
    dispatch({ type: "validateInformationsComplementaires", valid: "Valid" })
  }

  const {
    noteIndex,
    trancheEffectifs,
    indicateurUn: { noteIndicateurUn, effectifsIndicateurUnCalculable },
    indicateurDeux: { noteIndicateurDeux, effectifsIndicateurDeuxCalculable },
    indicateurTrois: { noteIndicateurTrois, effectifsIndicateurTroisCalculable },
    indicateurDeuxTrois: {
      noteIndicateurDeuxTrois,
      effectifsIndicateurDeuxTroisCalculable,
      indicateurDeuxTroisCalculable,
    },
    indicateurQuatre: { noteIndicateurQuatre, indicateurQuatreCalculable },
    indicateurCinq: { noteIndicateurCinq },
  } = computeValuesFromState(state)

  const indicateurUnNonCalculable = !effectifsIndicateurUnCalculable
  const indicateurDeuxNonCalculable = !effectifsIndicateurDeuxCalculable
  const indicateurTroisNonCalculable = !effectifsIndicateurTroisCalculable
  const indicateurDeuxTroisNonCalculable = !effectifsIndicateurDeuxTroisCalculable || !indicateurDeuxTroisCalculable
  const indicateurQuatreNonCalculable = !indicateurQuatreCalculable

  // TODO: useCallback with state as dependency.
  const FormInputs = ({
    trancheEffectifs,
    finPeriodeReference,
  }: {
    trancheEffectifs: TrancheEffectifs
    finPeriodeReference: string | undefined
  }) => {
    let augmentationInputs: Record<string, any> = {
      objectifIndicateurDeuxTrois: objectifValidator(
        noteIndicateurDeuxTrois,
        MAX_NOTES_INDICATEURS["indicateurDeuxTrois"],
        indicateurDeuxTroisNonCalculable,
      ),
    }
    if (trancheEffectifs !== "50 à 250") {
      augmentationInputs = {
        objectifIndicateurDeux: objectifValidator(
          noteIndicateurDeux,
          MAX_NOTES_INDICATEURS["indicateurDeux"],
          indicateurDeuxNonCalculable,
        ),
        objectifIndicateurTrois: objectifValidator(
          noteIndicateurTrois,
          MAX_NOTES_INDICATEURS["indicateurTrois"],
          indicateurTroisNonCalculable,
        ),
      }
    }
    const parsedFinPeriodeReference = finPeriodeReference ? parseDate(finPeriodeReference) : undefined

    return z
      .object({
        objectifIndicateurUn: objectifValidator(
          noteIndicateurUn,
          MAX_NOTES_INDICATEURS["indicateurUn"],
          indicateurUnNonCalculable,
        ),
        objectifIndicateurQuatre: objectifValidator(
          noteIndicateurQuatre,
          MAX_NOTES_INDICATEURS["indicateurQuatre"],
          indicateurQuatreNonCalculable,
        ),
        objectifIndicateurCinq: objectifValidator(noteIndicateurCinq, MAX_NOTES_INDICATEURS["indicateurCinq"]),
        datePublication: isDateBeforeFinPeriodeReference(parsedFinPeriodeReference),
        datePublicationObjectifs: isDateBeforeFinPeriodeReference(parsedFinPeriodeReference),
        datePublicationMesures: isDateBeforeFinPeriodeReference(parsedFinPeriodeReference),
        mesuresCorrection: z.string(),
        publicationSurSiteInternet: z.union([z.literal("true"), z.literal("false")]),
        lienPublication: z.string(),
        modalitesPublication: z.string().optional(),
        ...augmentationInputs,
      })
      .refine((val) => (val.publicationSurSiteInternet === "true" ? val.lienPublication !== "" : true), {
        message: "erreur sur le champ lienPublication",
        path: ["lienPublication"],
      })
      .refine((val) => (val.publicationSurSiteInternet === "false" ? val.modalitesPublication !== "" : true), {
        message: "erreur sur le champ modalitesPublication",
        path: ["modalitesPublication"],
      })
  }

  // Helpers for UI
  const after2020 = Boolean(state.informations.anneeDeclaration && state.informations.anneeDeclaration >= 2020)
  const displayNC = noteIndex === undefined && after2020 ? " aux indicateurs calculables" : ""
  const typeIndex = !noteIndex ? "Impossible state" : noteIndex > 85 ? "85:100" : noteIndex >= 75 ? "75:85" : "0:75"

  const siteWebLabel =
    typeIndex === "75:85"
      ? "Adresse exacte de la page Internet (URL) sur laquelle devront être publiés les objectifs de progression"
      : typeIndex === "0:75"
      ? "Adresse exacte de la page Internet (URL) sur laquelle devront être publiés les objectifs de progression et les mesures de correction"
      : ""

  const siteWebDetails =
    typeIndex === "85:100"
      ? "Pour rappel, les objectifs de progression doivent être publiés sur la même page du site internet que celle où figurent les résultats obtenus à chacun des indicateurs et le niveau de résultat à l'Index."
      : typeIndex === "75:85"
      ? "Pour rappel, les objectifs de progression et les mesures de correction doivent être publiés sur la même page du site internet que celle où figurent les résultats obtenus à chacun des indicateurs et le niveau de résultat à l'Index."
      : ""

  const modaliteQuestion = `Préciser les modalités de communication des objectifs de progression ${
    typeIndex === "0:75" ? "et des mesures de correction" : ""
  } auprès de vos salariés`

  if (!state.informations.periodeSuffisante)
    return <Text>Vous n'avez pas à remplir cette page car l'entreprise n'a pas au moins 12 mois d'existence.</Text>

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={initialValues}
      validate={formValidator(
        FormInputs({ trancheEffectifs, finPeriodeReference: state.informations.finPeriodeReference }),
      )}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ handleSubmit, hasValidationErrors, submitFailed, values, errors }) => (
        <form onSubmit={handleSubmit}>
          <pre>{JSON.stringify({ values }, null, 2)}</pre>
          <pre>{JSON.stringify({ errors }, null, 2)}</pre>
          <FormAutoSave saveForm={saveForm} />
          <FormStack>
            {submitFailed && hasValidationErrors && (
              <FormError message="Le formulaire ne peut pas être validé si tous les champs ne sont pas remplis." />
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
                  value={
                    values.publicationSurSiteInternet !== undefined
                      ? String(values.publicationSurSiteInternet)
                      : undefined
                  }
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

            {/* Objectifs de progression si index < 85 */}
            {noteIndex !== undefined && noteIndex < 85 && (
              <>
                <Text fontWeight="semibold" fontSize="sm">
                  Conformément à la loi n° 2020-1721 du 29 décembre 2020 de finances pour 2021 et aux articles L.
                  1142-9-1 et D. 1142-6-1 du code du travail, indiquer{" "}
                  <span style={{ textDecoration: "underline" }}>les objectifs de progression</span> fixés pour chaque
                  indicateur pour lequel la note maximale n'a pas été atteinte :
                </Text>
                <RowProgression
                  valueOrigin={
                    indicateurUnNonCalculable
                      ? "NC"
                      : String(noteIndicateurUn) + "/" + MAX_NOTES_INDICATEURS["indicateurUn"]
                  }
                  isDisabled={indicateurUnNonCalculable || noteIndicateurUn === MAX_NOTES_INDICATEURS["indicateurUn"]}
                  fieldName="objectifIndicateurUn"
                  isReadOnly={readOnly || indicateurUnNonCalculable}
                  min={noteIndicateurUn}
                  max={MAX_NOTES_INDICATEURS["indicateurUn"]}
                >
                  Écart de rémunération objectif
                </RowProgression>
                {trancheEffectifs === "50 à 250" ? (
                  <>
                    <RowProgression
                      valueOrigin={
                        indicateurDeuxTroisNonCalculable
                          ? "NC"
                          : String(noteIndicateurDeuxTrois) + "/" + MAX_NOTES_INDICATEURS["indicateurDeuxTrois"]
                      }
                      fieldName="objectifIndicateurDeuxTrois"
                      isReadOnly={readOnly || indicateurDeuxTroisNonCalculable}
                      isDisabled={
                        indicateurDeuxTroisNonCalculable ||
                        noteIndicateurDeuxTrois === MAX_NOTES_INDICATEURS["indicateurDeuxTrois"]
                      }
                      min={noteIndicateurDeuxTrois}
                      max={MAX_NOTES_INDICATEURS["indicateurDeuxTrois"]}
                    >
                      Écart de taux d'augmentations individuelles
                    </RowProgression>
                  </>
                ) : (
                  <>
                    <RowProgression
                      valueOrigin={
                        indicateurDeuxNonCalculable
                          ? "NC"
                          : String(noteIndicateurDeux) + "/" + MAX_NOTES_INDICATEURS["indicateurDeux"]
                      }
                      fieldName="objectifIndicateurDeux"
                      isReadOnly={readOnly || indicateurDeuxNonCalculable}
                      isDisabled={
                        indicateurDeuxNonCalculable || noteIndicateurDeux === MAX_NOTES_INDICATEURS["indicateurDeux"]
                      }
                      min={noteIndicateurDeux}
                      max={MAX_NOTES_INDICATEURS["indicateurDeux"]}
                    >
                      Écart de taux d'augmentations individuelles
                    </RowProgression>

                    <RowProgression
                      valueOrigin={
                        indicateurTroisNonCalculable
                          ? "NC"
                          : String(noteIndicateurTrois) + "/" + MAX_NOTES_INDICATEURS["indicateurTrois"]
                      }
                      fieldName="objectifIndicateurTrois"
                      isReadOnly={readOnly || indicateurTroisNonCalculable}
                      isDisabled={
                        indicateurTroisNonCalculable || noteIndicateurTrois === MAX_NOTES_INDICATEURS["indicateurTrois"]
                      }
                      min={noteIndicateurTrois}
                      max={MAX_NOTES_INDICATEURS["indicateurTrois"]}
                    >
                      Écart de taux de promotions
                    </RowProgression>
                  </>
                )}
                <>
                  <RowProgression
                    valueOrigin={
                      indicateurQuatreNonCalculable
                        ? "NC"
                        : String(noteIndicateurQuatre) + "/" + MAX_NOTES_INDICATEURS["indicateurQuatre"]
                    }
                    fieldName="objectifIndicateurQuatre"
                    isReadOnly={readOnly || indicateurQuatreNonCalculable}
                    isDisabled={
                      indicateurQuatreNonCalculable ||
                      noteIndicateurQuatre === MAX_NOTES_INDICATEURS["indicateurQuatre"]
                    }
                    min={noteIndicateurQuatre}
                    max={MAX_NOTES_INDICATEURS["indicateurQuatre"]}
                  >
                    Retour de congé maternité
                  </RowProgression>
                </>
                <>
                  <RowProgression
                    valueOrigin={String(noteIndicateurCinq) + "/" + MAX_NOTES_INDICATEURS["indicateurCinq"]}
                    fieldName="objectifIndicateurCinq"
                    isReadOnly={readOnly}
                    isDisabled={noteIndicateurCinq === MAX_NOTES_INDICATEURS["indicateurCinq"]}
                    min={noteIndicateurCinq}
                    max={MAX_NOTES_INDICATEURS["indicateurCinq"]}
                  >
                    Dix plus hautes rémunérations
                  </RowProgression>
                </>
                <InputDateGroup
                  fieldName="datePublicationObjectifs"
                  label="Date de publication des objectifs de progression"
                  isReadOnly={readOnly}
                />
              </>
            )}

            {/* Mesures de correction si index < 75 */}
            {noteIndex !== undefined && noteIndex < 75 && (
              <>
                <MesuresCorrection
                  label="Mesures de correction prévues à l'article D. 1142-6"
                  name="mesuresCorrection"
                  readOnly={readOnly}
                />
                <InputDateGroup
                  fieldName="datePublicationMesures"
                  label="Date de publication des mesures de correction"
                  isReadOnly={readOnly}
                />
              </>
            )}

            {state.informationsComplementaires.publicationSurSiteInternet && (
              <>
                <InputGroup label={siteWebLabel} fieldName="lienPublication" isReadOnly={true} showError={false} />
                <Text>{siteWebDetails}</Text>
              </>
            )}

            {/* Modalités pour objectifs et/ou les mesures, si index < 85 */}
            {noteIndex !== undefined && noteIndex < 85 && (
              <TextareaGroup
                label={modaliteQuestion}
                fieldName="modalitesPublicationObjectifsMesures"
                isReadOnly={readOnly}
              />
            )}
          </FormStack>

          {readOnly ? (
            <ActionBar>
              <ButtonSimulatorLink to="/declaration" label="Suivant" />
              &emsp;
              {state.informationsComplementaires.formValidated === "Valid" && (
                <ButtonAction
                  leftIcon={<IconEdit />}
                  label="Modifier les données saisies"
                  onClick={() => dispatch({ type: "validateInformationsComplementaires", valid: "None" })}
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

export default InformationsComplementairesForm
