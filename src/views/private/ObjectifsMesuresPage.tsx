import { Grid, GridItem, Text } from "@chakra-ui/react"
import React, { FunctionComponent } from "react"
import { Form } from "react-final-form"
import { useParams } from "react-router-dom"
import { z } from "zod"

import type { TrancheEffectifs } from "../../globals"

import ActionBar from "../../components/ActionBar"
import FakeInputGroup from "../../components/ds/FakeInputGroup"
import { formValidator } from "../../components/ds/form-lib"
import FormStack from "../../components/ds/FormStack"
import InfoBlock from "../../components/ds/InfoBlock"
import InputDateGroup from "../../components/ds/InputDateGroup"
import InputGroup from "../../components/ds/InputGroup"
import TextareaGroup from "../../components/ds/TextareaGroup"
import FormError from "../../components/FormError"
import FormSubmit from "../../components/FormSubmit"
import { useDeclaration } from "../../hooks/useDeclaration"
import { MAX_NOTES_INDICATEURS } from "../../utils/calculsEgaProIndex"
import { dateToString, parseDate } from "../../utils/date"
import { parseTrancheEffectifsFormValue } from "../../utils/formHelpers"
import {
  Indicateur1Calculable,
  Indicateur2Calculable,
  Indicateur2et3Calculable,
  Indicateur3Calculable,
  Indicateur4Calculable,
  Indicateur5,
  IndicateurNonCalculable,
} from "../../utils/helpers"
import { SinglePageLayout } from "../../containers/SinglePageLayout"
import Page from "../../components/Page"
import { useToastMessage } from "../../utils/hooks"

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
        .refine((value) => Number(value) > originValue && Number(value) <= max, {
          message: invalid_type_error(originValue + 1, max),
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

const title = "Remplir les objectifs de progression et mesures de correction"

export type ObjectifsMesuresFormSchema = {
  objectifIndicateurUn?: string | undefined
  objectifIndicateurDeux?: string | undefined
  objectifIndicateurTrois?: string | undefined
  objectifIndicateurDeuxTrois?: string | undefined
  objectifIndicateurQuatre?: string | undefined
  objectifIndicateurCinq?: string | undefined
  datePublicationMesures?: string | undefined
  datePublicationObjectifs?: string | undefined
  modalitesPublicationObjectifsMesures: string | undefined
}

const ObjectifsMesuresPage: FunctionComponent<Record<string, never>> = () => {
  const { siren, year } = useParams<Params>()

  const { declaration } = useDeclaration(siren, Number(year))

  const { toastSuccess } = useToastMessage({})

  const index = declaration.data.déclaration.index

  const trancheEffectifs = parseTrancheEffectifsFormValue(declaration.data.entreprise.effectif.tranche)

  const publicationSurSiteInternet = Boolean(declaration?.data.déclaration?.publication?.url)

  const initialValues = {
    objectifIndicateurUn: (declaration.data.indicateurs?.rémunérations as Indicateur1Calculable)
      ?.objectif_de_progression
      ? String((declaration.data.indicateurs?.rémunérations as Indicateur1Calculable)?.objectif_de_progression)
      : undefined,
    objectifIndicateurDeux: (declaration.data.indicateurs?.augmentations as Indicateur2Calculable)
      ?.objectif_de_progression
      ? String((declaration.data.indicateurs?.augmentations as Indicateur2Calculable)?.objectif_de_progression)
      : undefined,
    objectifIndicateurTrois: (declaration.data.indicateurs?.promotions as Indicateur3Calculable)
      ?.objectif_de_progression
      ? String((declaration.data.indicateurs?.promotions as Indicateur3Calculable)?.objectif_de_progression)
      : undefined,
    objectifIndicateurDeuxTrois: (declaration.data.indicateurs?.augmentations_et_promotions as Indicateur2et3Calculable)
      ?.objectif_de_progression
      ? String(
          (declaration.data.indicateurs?.augmentations_et_promotions as Indicateur2et3Calculable)
            ?.objectif_de_progression,
        )
      : undefined,
    objectifIndicateurQuatre: (declaration.data.indicateurs?.congés_maternité as Indicateur4Calculable)
      ?.objectif_de_progression
      ? String((declaration.data.indicateurs?.congés_maternité as Indicateur4Calculable)?.objectif_de_progression)
      : undefined,
    objectifIndicateurCinq: (declaration.data.indicateurs?.hautes_rémunérations as Indicateur5)?.objectif_de_progression
      ? String((declaration.data.indicateurs?.hautes_rémunérations as Indicateur5)?.objectif_de_progression)
      : undefined,
    datePublicationMesures: declaration.data.déclaration.publication?.date_publication_mesures,
    datePublicationObjectifs: declaration.data.déclaration.publication?.date_publication_objectifs,
    modalitesPublicationObjectifsMesures: declaration.data.déclaration.publication?.modalités_objectifs_mesures,
  }

  const onSubmit = (formData: typeof initialValues) => {
    console.log("dans onSubmit", JSON.stringify(formData, null, 2))
    toastSuccess("Les informations ont bien été sauvegardées")

    const newDeclaration = { ...declaration, ...formData }
    console.log("declaration", JSON.stringify(declaration, null, 2))
    console.log("formData", JSON.stringify(formData, null, 2))

    // const newDeclaration2 = { ...declaration.data, toto: declaration.data.indicateurs?.rémunérations }
  }

  const {
    rémunérations,
    augmentations,
    promotions,
    augmentations_et_promotions,
    congés_maternité,
    hautes_rémunérations,
  } = declaration.data.indicateurs || {}

  const noteIndicateurUn = (rémunérations as Indicateur1Calculable)?.note
  const indicateurUnNonCalculable = Boolean((rémunérations as IndicateurNonCalculable)?.non_calculable)

  const noteIndicateurDeux = (augmentations as Indicateur2Calculable)?.note
  const indicateurDeuxNonCalculable = Boolean((augmentations as IndicateurNonCalculable)?.non_calculable)
  const noteIndicateurTrois = (promotions as Indicateur3Calculable)?.note
  const indicateurTroisNonCalculable = Boolean((promotions as IndicateurNonCalculable)?.non_calculable)
  const noteIndicateurDeuxTrois = (augmentations_et_promotions as Indicateur2et3Calculable)?.note
  const indicateurDeuxTroisNonCalculable = Boolean(
    (augmentations_et_promotions as IndicateurNonCalculable)?.non_calculable,
  )
  const noteIndicateurQuatre = (congés_maternité as Indicateur4Calculable)?.note
  const indicateurQuatreNonCalculable = Boolean((congés_maternité as IndicateurNonCalculable)?.non_calculable)
  const noteIndicateurCinq = (hautes_rémunérations as Indicateur5)?.note

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
        datePublicationObjectifs: isDateBeforeFinPeriodeReference(parsedFinPeriodeReference),
        datePublicationMesures: isDateBeforeFinPeriodeReference(parsedFinPeriodeReference),
        modalitesPublicationObjectifsMesures: z.unknown(),
      })
      .refine(
        (val) =>
          !noteIndex
            ? true
            : noteIndex < 75 || (noteIndex < 85 && publicationSurSiteInternet === false)
            ? Boolean(val.modalitesPublicationObjectifsMesures)
            : !val.modalitesPublicationObjectifsMesures,
        {
          message: "erreur sur champ modalitesPublicationObjectifsMesures",
          path: ["modalitesPublicationObjectifsMesures"],
        },
      )
  }

  // Helpers for UI
  const after2021 = Boolean(
    declaration.data.déclaration.année_indicateurs && declaration.data.déclaration.année_indicateurs >= 2021,
  )

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
  const buildModaliteQuestion = (publicationSurSiteInternet: boolean) => {
    let modaliteQuestion = ""

    if (index && index < 85 && publicationSurSiteInternet !== undefined) {
      let subDetail = ""
      if (publicationSurSiteInternet) {
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
    <SinglePageLayout>
      <Page title={title}>
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

                {(index !== undefined || after2021) && (
                  <>
                    {/* Mesures de correction si index < 75 - ce champ est arrivé en 2022, pour des données 2021 */}
                    {index !== undefined && index < 75 && (
                      <>
                        <InfoBlock
                          type="warning"
                          text="Votre index étant inférieur à 75, veuillez renseigner les informations suivantes sur les mesures de correction."
                        />

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
                          Conformément à la loi n° 2020-1721 du 29 décembre 2020 de finances pour 2021 et aux articles
                          L. 1142-9-1 et D. 1142-6-1 du code du travail, indiquer{" "}
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

                    {!publicationSurSiteInternet && (
                      <InfoBlock
                        type="warning"
                        text="Vous n'avez pas renseigné de site web pour publier vos résultats. Veuillez renseigner les informations suivantes sur les mesures de correction."
                      />
                    )}

                    {publicationSurSiteInternet && (
                      <>
                        <InputGroup
                          label={siteWebLabel}
                          fieldName="lienPublication"
                          isReadOnly={true}
                          showError={false}
                        />
                        <Text>{siteWebDetails}</Text>
                      </>
                    )}

                    {/* Modalités pour objectifs et/ou les mesures, si index < 85 */}
                    {index !== undefined && index < 85 && (
                      <TextareaGroup
                        label={buildModaliteQuestion(publicationSurSiteInternet)}
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
      </Page>
    </SinglePageLayout>
  )
}

export default ObjectifsMesuresPage
