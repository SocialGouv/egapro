import React, { FunctionComponent } from "react"
import { Text, GridItem, Grid } from "@chakra-ui/react"
import { z } from "zod"

import { AppState, TrancheEffectifs } from "../../globals"

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
import {
  Indicateur1Calculable,
  Indicateur1NonCalculable,
  Indicateur2Calculable,
  Indicateur2et3Calculable,
  Indicateur2et3NonCalculable,
  Indicateur2NonCalculable,
  Indicateur3Calculable,
  Indicateur3NonCalculable,
  Indicateur4Calculable,
  Indicateur4NonCalculable,
  Indicateur5,
} from "../../utils/helpers"
import FakeInputGroup from "../../components/ds/FakeInputGroup"
import MesuresCorrection from "../../components/MesuresCorrection"
import InputDateGroup from "../../components/ds/InputDateGroup"
import { MAX_NOTES_INDICATEURS } from "../../utils/calculsEgaProIndex"
import RadiosBoolean from "../../components/RadiosBoolean"
import { dateToString, parseDate } from "../../utils/date"
import { FormInputs, parseBooleanFormValue, parseTrancheEffectifsFormValue } from "../../utils/formHelpers"
import InfoBlock from "../../components/ds/InfoBlock"
import { Form } from "react-final-form"
import { useParams } from "react-router-dom"
import { useDeclaration } from "../../hooks/useDeclaration"

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

interface ObjectifsMesuresProps {
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
    <Grid templateColumns="250px 80px 80px" templateRows="1fr 2fr" gap={2} alignItems="center">
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
        {!isDisabled && (
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
        )}
      </GridItem>
    </Grid>
  )
}

type Params = {
  siren: string
  year: string
}

const ObjectifsMesures: FunctionComponent<Record<string, never>> = () => {
  const { siren, year } = useParams<Params>()

  console.log("siren, year", siren, year)

  const { declaration } = useDeclaration(siren, Number(year))

  const index = declaration.data.déclaration.index

  const trancheEffectifs = parseTrancheEffectifsFormValue(declaration.data.entreprise.effectif.tranche)

  const publicationSurSiteInternet = Boolean(declaration?.data.déclaration?.publication?.url)

  const initialValues = {
    publicationSurSiteInternet,
    ...declaration,
  }

  const onSubmit = (formData: any) => {
    console.log("dans onSubmit")
  }

  const {
    rémunérations,
    augmentations,
    promotions,
    augmentations_et_promotions,
    congés_maternité,
    hautes_rémunérations,
  } = declaration.data.indicateurs || {}

  const noteIndicateurUn = (rémunérations as Indicateur1Calculable)?.note || undefined
  const indicateurUnNonCalculable = Boolean((rémunérations as Indicateur1NonCalculable)?.non_calculable)
  const noteIndicateurDeux = (augmentations as Indicateur2Calculable)?.note || undefined
  const indicateurDeuxNonCalculable = Boolean((augmentations as Indicateur2NonCalculable)?.non_calculable)
  const noteIndicateurTrois = (promotions as Indicateur3Calculable)?.note || undefined
  const indicateurTroisNonCalculable = Boolean((promotions as Indicateur3NonCalculable)?.non_calculable)
  const noteIndicateurDeuxTrois = (augmentations_et_promotions as Indicateur2et3Calculable)?.note || undefined
  const indicateurDeuxTroisNonCalculable = Boolean(
    (augmentations_et_promotions as Indicateur2et3NonCalculable)?.non_calculable,
  )
  const noteIndicateurQuatre = (congés_maternité as Indicateur4Calculable)?.note || undefined
  const indicateurQuatreNonCalculable = Boolean((congés_maternité as Indicateur4NonCalculable)?.non_calculable)
  const noteIndicateurCinq = (hautes_rémunérations as Indicateur5)?.note || undefined

  // TODO: useCallback with state as dependency.
  const FormInputs = ({
    trancheEffectifs,
    finPeriodeReference,
    noteIndex,
  }: {
    trancheEffectifs: TrancheEffectifs
    finPeriodeReference: string | undefined
    noteIndex: number | undefined
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
        ...augmentationInputs,
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
        modalitesPublicationObjectifsMesures: z.unknown(),
      })
      .refine((val) => (val.publicationSurSiteInternet === "true" ? val.lienPublication !== "" : true), {
        message: "erreur sur le champ lienPublication",
        path: ["lienPublication"],
      })
      .refine((val) => (val.publicationSurSiteInternet === "false" ? val.modalitesPublication !== "" : true), {
        message: "erreur sur le champ modalitesPublication",
        path: ["modalitesPublication"],
      })
      .refine(
        (val) =>
          !noteIndex
            ? true
            : noteIndex < 75 || (noteIndex < 85 && val.publicationSurSiteInternet === "false")
            ? Boolean(val.modalitesPublicationObjectifsMesures)
            : !val.modalitesPublicationObjectifsMesures,
        {
          message: "erreur sur champ modalitesPublicationObjectifsMesures",
          path: ["modalitesPublicationObjectifsMesures"],
        },
      )
  }

  // Helpers for UI
  const after2020 = Boolean(
    declaration.data.déclaration.année_indicateurs && declaration.data.déclaration.année_indicateurs >= 2020,
  )
  const after2021 = Boolean(
    declaration.data.déclaration.année_indicateurs && declaration.data.déclaration.année_indicateurs >= 2021,
  )

  const displayNC = index === undefined && after2020 ? " aux indicateurs calculables" : ""
  const typeIndex = !index ? "Impossible state" : index > 85 ? "85:100" : index >= 75 ? "75:85" : "0:75"

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

  // Make label for modaliteQuestion if needed.
  const buildModaliteQuestion = (publicationSurSiteInternet: string | undefined) => {
    let modaliteQuestion = ""

    if (index && index < 85 && publicationSurSiteInternet !== undefined) {
      let subDetail = ""
      if (publicationSurSiteInternet === "true") {
        if (index < 75) subDetail = "mesures de correction"
      } else {
        if (index < 75) subDetail = "objectifs de progression et des mesures de correction"
        else if (index >= 75) subDetail = "objectifs de progression"
      }

      modaliteQuestion = `Préciser les modalités de communication des ${subDetail} auprès de vos salariés`
    }

    return modaliteQuestion
  }

  if (!declaration.data.déclaration.période_suffisante)
    return <Text>Vous n'avez pas à remplir cette page car l'entreprise n'a pas au moins 12 mois d'existence.</Text>

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={initialValues}
      validate={formValidator(
        FormInputs({
          trancheEffectifs,
          finPeriodeReference: declaration.data.déclaration.fin_période_référence,
          noteIndex: index,
        }),
      )}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ handleSubmit, hasValidationErrors, submitFailed, values, errors }) => (
        <form onSubmit={handleSubmit}>
          {/* {JSON.stringify(errors, null, 2)}
          {JSON.stringify(values, null, 2)} */}
          <FormStack>
            {submitFailed && hasValidationErrors && (
              <FormError message="Le formulaire ne peut pas être validé si tous les champs ne sont pas remplis." />
            )}

            {(index !== undefined || after2020) && (
              <>
                <InputDateGroup
                  fieldName="datePublication"
                  label={
                    after2020
                      ? `Date de publication des résultats obtenus${displayNC}`
                      : "Date de publication du niveau de résultat obtenu"
                  }
                  isReadOnly={false}
                />
                <RadiosBoolean
                  fieldName="publicationSurSiteInternet"
                  value={
                    values.publicationSurSiteInternet !== undefined
                      ? String(values.publicationSurSiteInternet)
                      : undefined
                  }
                  readOnly={false}
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
                    isReadOnly={false}
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
                    isReadOnly={false}
                  />
                )}
              </>
            )}

            {/* Mesures de correction si index < 75 - ce champ est historique et existe depuis des données 2019 */}
            {index !== undefined && index < 75 && (
              <>
                <InfoBlock
                  type="warning"
                  text="Votre index étant inférieur à 75, veuillez renseigner les informations suivantes sur les mesures de correction."
                />

                <MesuresCorrection
                  label="Mesures de correction prévues à l'article D. 1142-6"
                  name="mesuresCorrection"
                  readOnly={false}
                />
              </>
            )}

            {(index !== undefined || after2021) && (
              <>
                {/* Mesures de correction si index < 75 - ce champ est arrivé en 2022, pour des données 2021 */}
                {index !== undefined && index < 75 && (
                  <>
                    <InputDateGroup
                      fieldName="datePublicationMesures"
                      label="Date de publication des mesures de correction"
                      isReadOnly={false}
                    />
                  </>
                )}

                {/* Objectifs de progression si index < 85 */}
                {index !== undefined && index < 85 && (
                  <>
                    <InfoBlock
                      type="warning"
                      text="Votre index étant inférieur à 85, veuillez renseigner vos objectifs de progression pour les indicateurs calculables."
                    />
                    <Text fontWeight="semibold" fontSize="sm">
                      Conformément à la loi n° 2020-1721 du 29 décembre 2020 de finances pour 2021 et aux articles L.
                      1142-9-1 et D. 1142-6-1 du code du travail, indiquer{" "}
                      <span style={{ textDecoration: "underline" }}>les objectifs de progression</span> fixés pour
                      chaque indicateur pour lequel la note maximale n'a pas été atteinte :
                    </Text>
                    <RowProgression
                      valueOrigin={
                        indicateurUnNonCalculable
                          ? "NC"
                          : String(noteIndicateurUn) + "/" + MAX_NOTES_INDICATEURS["indicateurUn"]
                      }
                      fieldName="objectifIndicateurUn"
                      isReadOnly={indicateurUnNonCalculable}
                      isDisabled={
                        indicateurUnNonCalculable || noteIndicateurUn === MAX_NOTES_INDICATEURS["indicateurUn"]
                      }
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
                          isReadOnly={indicateurDeuxTroisNonCalculable}
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
                          isReadOnly={indicateurDeuxNonCalculable}
                          isDisabled={
                            indicateurDeuxNonCalculable ||
                            noteIndicateurDeux === MAX_NOTES_INDICATEURS["indicateurDeux"]
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
                          isReadOnly={indicateurTroisNonCalculable}
                          isDisabled={
                            indicateurTroisNonCalculable ||
                            noteIndicateurTrois === MAX_NOTES_INDICATEURS["indicateurTrois"]
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
                        isReadOnly={indicateurQuatreNonCalculable}
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
                        isReadOnly={false}
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
                      isReadOnly={false}
                    />
                  </>
                )}

                {publicationSurSiteInternet && (
                  <>
                    <InputGroup label={siteWebLabel} fieldName="lienPublication" isReadOnly={true} showError={false} />
                    <Text>{siteWebDetails}</Text>
                  </>
                )}

                {/* Modalités pour objectifs et/ou les mesures, si index < 85 */}
                {index !== undefined && index < 85 && (
                  <TextareaGroup
                    label={buildModaliteQuestion(values.publicationSurSiteInternet)}
                    fieldName="modalitesPublicationObjectifsMesures"
                    isReadOnly={false}
                  />
                )}
              </>
            )}
          </FormStack>

          <ActionBar>
            <FormSubmit />
          </ActionBar>
        </form>
      )}
    </Form>
  )
}

export default ObjectifsMesures
