import { Box, Grid, GridItem, Heading, Spinner, Text } from "@chakra-ui/react"
import React, { FunctionComponent, PropsWithChildren } from "react"
import { Form } from "react-final-form"
import { useHistory, useParams } from "react-router-dom"
import { z } from "zod"

import type { TrancheEffectifsAPI } from "../../globals"
import type {
  DeclarationAPI,
  Indicateur1Calculable,
  Indicateur2Calculable,
  Indicateur2et3Calculable,
  Indicateur3Calculable,
  Indicateur4Calculable,
  Indicateur5,
  IndicateurNonCalculable,
} from "../../utils/declarationBuilder"

import { fromUnixTime } from "date-fns"
import ActionBar from "../../components/ActionBar"
import ButtonAction from "../../components/ds/ButtonAction"
import ButtonLink from "../../components/ds/ButtonLink"
import FakeInputGroup from "../../components/ds/FakeInputGroup"
import { formValidator } from "../../components/ds/form-lib"
import FormStack from "../../components/ds/FormStack"
import InfoBlock from "../../components/ds/InfoBlock"
import InputDateGroup from "../../components/ds/InputDateGroup"
import InputGroup from "../../components/ds/InputGroup"
import LegalText from "../../components/ds/LegalText"
import TextareaCounter from "../../components/ds/TextareaCounter"
import TextareaGroup from "../../components/ds/TextareaGroup"
import FormError from "../../components/FormError"
import FormSubmit from "../../components/FormSubmit"
import Page from "../../components/Page"
import { SinglePageLayout } from "../../containers/SinglePageLayout"
import { useDeclaration } from "../../hooks/useDeclaration"
import { postOpMc, sendReceiptObjectifsMesures } from "../../utils/api"
import { MAX_NOTES_INDICATEURS } from "../../utils/calculsEgaProIndex"
import { dateToFrString, isOlderThanTimeAgo, parseDate } from "../../utils/date"
import { useToastMessage } from "../../utils/hooks"

const Title = ({ children }: PropsWithChildren) => (
  <Box>
    <Heading as="h2" size="md" mt="6">
      {children}
    </Heading>
  </Box>
)

const required_error = "Ce champ ne peut être vide"

/**
 * Zod validator for an objective indicator.
 *
 * @param originValue The actual value for this indicator.
 * @param max The maximum value for this in ddicator.
 * @param nonCalculable If true, the value is not calculable.
 */
export const objectifValidator = (
  originValue: number,
  max: number,
  nonCalculable = false,
): z.ZodUndefined | z.ZodString =>
  nonCalculable || originValue === max
    ? z.undefined()
    : z
        .string({
          required_error,
        })
        .min(1, { message: required_error })
        .max(300, { message: "L'objectif doit être un texte de 300 caractères max." })

/**
 * Zod validator in relation to the publication dates and the end of reference period.
 */
const isDateBeforeFinPeriodeReference = (finPeriodeReference?: Date) =>
  z
    .string({ required_error })
    .min(1, { message: required_error })
    .refine(
      (value) => {
        if (!finPeriodeReference) return true
        const parsedDatePublication = parseDate(value)
        return parsedDatePublication !== undefined && parsedDatePublication > finPeriodeReference
      },
      {
        message: `La date ne peut précéder la date de fin de la période de référence choisie pour le calcul de votre index (${dateToFrString(
          finPeriodeReference,
        )})`,
      },
    )

type RowProgressionProps = {
  children: string
  valueOrigin: string
  fieldName: string
  isReadOnly: boolean
  isDisabled: boolean
}

const RowProgression: FunctionComponent<RowProgressionProps> = ({
  children,
  valueOrigin,
  fieldName,
  isReadOnly = false,
  isDisabled = false,
}) => {
  return (
    <Grid templateColumns="250px 80px 400px" templateRows="1fr 4fr" gap={2} alignItems="top">
      <GridItem />
      <GridItem>
        <Text fontSize="sm" textAlign="center">
          Actuel
        </Text>
      </GridItem>
      <GridItem textAlign="center">
        <Text fontSize="sm" textAlign="left">
          Objectif
        </Text>
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
          <TextareaCounter
            label=""
            fieldName={fieldName}
            isReadOnly={isReadOnly}
            isDisabled={isDisabled}
            textAlign="left"
            htmlSize={60}
            maxLength={300}
            showRemainingCharacters
            placeholder="Votre objectif en 300 caractères maximum"
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

export type ObjectifsMesuresFormSchema = {
  objectifIndicateurUn?: string
  objectifIndicateurDeux?: string
  objectifIndicateurTrois?: string
  objectifIndicateurDeuxTrois?: string
  objectifIndicateurQuatre?: string
  objectifIndicateurCinq?: string
  datePublicationMesures?: string
  datePublicationObjectifs?: string
  modalitesPublicationObjectifsMesures?: string
}

function buildWordings(index: number | undefined, publicationSurSiteInternet: boolean) {
  const title =
    index !== undefined && index < 75
      ? "Déclaration des objectifs de progression et des mesures de correction"
      : "Déclaration des objectifs de progression"

  const warningText =
    index !== undefined && index < 75
      ? "Votre index étant inférieur à 75, veuillez renseigner les informations suivantes."
      : "Votre index étant inférieur à 85, veuillez renseigner les informations suivantes."

  const legalText =
    index !== undefined && index < 75
      ? "Conformément à l’article 13 de la loi n° 2021-1774 du 24 décembre 2021 visant à accélérer l’égalité économique et professionnelle et au décret n° 2022-243 du 25 février 2022, les entreprises ayant obtenu un Index inférieur à 75 points doivent publier, par une communication externe et au sein de l’entreprise, les mesures de correction qu’elles ont définies par accord ou, à défaut, par décision unilatérale. Par ailleurs, celles ayant obtenu un Index inférieur à 85 points doivent fixer, également par accord ou, à défaut, par décision unilatérale, et publier des objectifs de progression de chacun des indicateurs de l’Index. Une fois l’accord ou la décision déposé, les informations relatives aux mesures de correction, les objectifs de progression ainsi que leurs modalités de publication doivent être transmis aux services du ministre chargé du travail et au comité social et économique."
      : "Conformément à l’article 13 de la loi n° 2021-1774 du 24 décembre 2021 visant à accélérer l’égalité économique et professionnelle et au décret n° 2022-243 du 25 février 2022, les entreprises ayant obtenu un Index inférieur à 85 points doivent fixer par accord ou, à défaut, par décision unilatérale, et publier des objectifs de progression de chacun des indicateurs de l’Index. Une fois l’accord ou la décision déposé, les objectifs de progression ainsi que leurs modalités de publication doivent être transmis aux services du ministre chargé du travail et au comité social et économique."

  const finalMessage =
    index !== undefined && index < 75
      ? "Vous venez de transmettre aux services du ministre chargé du travail vos objectifs de progression et mesures de correction"
      : "Vous venez de transmettre aux services du ministre chargé du travail vos objectifs de progression"

  const siteWebLabel =
    index !== undefined && index < 75
      ? "Adresse exacte de la page Internet (URL) sur laquelle devront être publiés les objectifs de progression et les mesures de correction"
      : "Adresse exacte de la page Internet (URL) sur laquelle devront être publiés les objectifs de progression"

  const siteWebReminder =
    index !== undefined && index < 75
      ? "Pour rappel, les objectifs de progression et les mesures de correction doivent être publiés sur la même page du site internet que celle où figurent les résultats obtenus à chacun des indicateurs et le niveau de résultat à l'Index."
      : "Pour rappel, les objectifs de progression doivent être publiés sur la même page du site internet que celle où figurent les résultats obtenus à chacun des indicateurs et le niveau de résultat à l'Index."

  let modalite = ""

  if (index !== undefined) {
    if (!publicationSurSiteInternet) {
      if (index >= 75 && index < 85)
        modalite = "Préciser les modalités de communication des objectifs de progression auprès de vos salariés."
      else if (index < 75)
        modalite =
          "Préciser les modalités de communication des objectifs de progression et des mesures de correction auprès de vos salariés."
    } else {
      if (index < 75)
        modalite = "Préciser les modalités de communication des mesures de correction auprès de vos salariés."
    }
  }

  return { title, warningText, legalText, finalMessage, siteWebLabel, siteWebReminder, modalite }
}

/**
 * Different helpers for managing the data for objectifs and mesures.
 *
 * Helpers are :
 * - property deeply nested which are returned flat in the return object.
 * - computed property (like after2021 or initialValuesObjectifsMesures)
 * - function like objectifsMesuresSchema for validating this part of the declaration object.
 *
 * These helpers are used by UI and by DeclarationListe to reuse the zod validation.
 */
export function buildHelpersObjectifsMesures(declaration?: DeclarationAPI) {
  const index = declaration?.data.déclaration.index
  const publicationSurSiteInternet = Boolean(declaration?.data.déclaration?.publication?.url)

  const trancheEffectifs = declaration?.data.entreprise.effectif.tranche as TrancheEffectifsAPI

  const after2021 = Boolean(
    declaration?.data.déclaration.année_indicateurs && declaration?.data.déclaration.année_indicateurs >= 2021,
  )

  const initialValuesObjectifsMesures = {
    objectifIndicateurUn: (declaration?.data.indicateurs?.rémunérations as Indicateur1Calculable)
      ?.objectif_de_progression
      ? String((declaration?.data.indicateurs?.rémunérations as Indicateur1Calculable)?.objectif_de_progression)
      : undefined,
    objectifIndicateurDeux: (declaration?.data.indicateurs?.augmentations as Indicateur2Calculable)
      ?.objectif_de_progression
      ? String((declaration?.data.indicateurs?.augmentations as Indicateur2Calculable)?.objectif_de_progression)
      : undefined,
    objectifIndicateurTrois: (declaration?.data.indicateurs?.promotions as Indicateur3Calculable)
      ?.objectif_de_progression
      ? String((declaration?.data.indicateurs?.promotions as Indicateur3Calculable)?.objectif_de_progression)
      : undefined,
    objectifIndicateurDeuxTrois: (
      declaration?.data.indicateurs?.augmentations_et_promotions as Indicateur2et3Calculable
    )?.objectif_de_progression
      ? String(
          (declaration?.data.indicateurs?.augmentations_et_promotions as Indicateur2et3Calculable)
            ?.objectif_de_progression,
        )
      : undefined,
    objectifIndicateurQuatre: (declaration?.data.indicateurs?.congés_maternité as Indicateur4Calculable)
      ?.objectif_de_progression
      ? String((declaration?.data.indicateurs?.congés_maternité as Indicateur4Calculable)?.objectif_de_progression)
      : undefined,
    objectifIndicateurCinq: (declaration?.data.indicateurs?.hautes_rémunérations as Indicateur5)
      ?.objectif_de_progression
      ? String((declaration?.data.indicateurs?.hautes_rémunérations as Indicateur5)?.objectif_de_progression)
      : undefined,
    datePublicationMesures: declaration?.data.déclaration.publication?.date_publication_mesures,
    datePublicationObjectifs: declaration?.data.déclaration.publication?.date_publication_objectifs,
    modalitesPublicationObjectifsMesures: declaration?.data.déclaration.publication?.modalités_objectifs_mesures,
    lienPublication: declaration?.data.déclaration.publication?.url,
  }

  const {
    rémunérations,
    augmentations,
    promotions,
    augmentations_et_promotions,
    congés_maternité,
    hautes_rémunérations,
  } = declaration?.data.indicateurs || {}

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

  const parsedFinPeriodeReference = declaration?.data.déclaration.fin_période_référence
    ? parseDate(declaration?.data.déclaration.fin_période_référence)
    : undefined

  // Beginning of zod validation schema
  let augmentationInputs: Record<string, any> = {
    objectifIndicateurDeuxTrois: objectifValidator(
      noteIndicateurDeuxTrois || 0,
      MAX_NOTES_INDICATEURS["indicateurDeuxTrois"],
      indicateurDeuxTroisNonCalculable,
    ),
  }
  if (trancheEffectifs !== "50:250") {
    augmentationInputs = {
      objectifIndicateurDeux: objectifValidator(
        noteIndicateurDeux || 0,
        MAX_NOTES_INDICATEURS["indicateurDeux"],
        indicateurDeuxNonCalculable,
      ),
      objectifIndicateurTrois: objectifValidator(
        noteIndicateurTrois || 0,
        MAX_NOTES_INDICATEURS["indicateurTrois"],
        indicateurTroisNonCalculable,
      ),
    }
  }

  const objectifsMesuresSchema = !after2021
    ? z.object({
        objectifIndicateurUn: z.undefined(),
        objectifIndicateurDeux: z.undefined(),
        objectifIndicateurTrois: z.undefined(),
        objectifIndicateurDeuxTrois: z.undefined(),
        objectifIndicateurQuatre: z.undefined(),
        objectifIndicateurCinq: z.undefined(),
        datePublicationObjectifs: z.undefined(),
        datePublicationMesures: z.undefined(),
        modalitesPublicationObjectifsMesures: z.undefined(),
      })
    : z
        .object({
          objectifIndicateurUn: objectifValidator(
            noteIndicateurUn || 0,
            MAX_NOTES_INDICATEURS["indicateurUn"],
            indicateurUnNonCalculable,
          ),
          ...augmentationInputs,
          objectifIndicateurQuatre: objectifValidator(
            noteIndicateurQuatre || 0,
            MAX_NOTES_INDICATEURS["indicateurQuatre"],
            indicateurQuatreNonCalculable,
          ),
          objectifIndicateurCinq: objectifValidator(noteIndicateurCinq || 0, MAX_NOTES_INDICATEURS["indicateurCinq"]),
          datePublicationObjectifs: isDateBeforeFinPeriodeReference(parsedFinPeriodeReference),
          datePublicationMesures: isDateBeforeFinPeriodeReference(parsedFinPeriodeReference).optional(),
          modalitesPublicationObjectifsMesures: z.string().optional(),
        })
        // NB : ces règles en zod ne sont pas appelées par React Final Form. Je ne sais pas pourquoi, mais j'imagine que c'est parce que le refine
        // se situe au niveau racine et pas au niveau d'un des champs. Il faudrait passer en React Hook Form qui supporte zod officiellement.
        // Côté form, on contourne en se basant sur l'autovalidation des champs date et textarea, qui impose qu'il y ait un contenu si le widget s'affiche.
        // Côté valiation des données d'un formulaire, c'est appelé correctement.
        .refine(
          (val) =>
            !index
              ? true
              : index < 75 || (index < 85 && publicationSurSiteInternet === false)
              ? typeof val.modalitesPublicationObjectifsMesures === "string" &&
                val.modalitesPublicationObjectifsMesures.trim().length
              : val.modalitesPublicationObjectifsMesures === undefined,
          {
            message: required_error,
            path: ["modalitesPublicationObjectifsMesures"],
          },
        )
        .refine(
          (val) => {
            return !index
              ? true
              : index < 75
              ? val.datePublicationMesures !== undefined
              : val.datePublicationMesures === undefined
          },
          {
            message: required_error,
            path: ["datePublicationMesures"],
          },
        )

  return {
    index,
    publicationSurSiteInternet,
    trancheEffectifs,
    after2021,
    initialValuesObjectifsMesures,
    noteIndicateurUn,
    indicateurUnNonCalculable,
    noteIndicateurDeux,
    indicateurDeuxNonCalculable,
    noteIndicateurTrois,
    indicateurTroisNonCalculable,
    noteIndicateurDeuxTrois,
    indicateurDeuxTroisNonCalculable,
    noteIndicateurQuatre,
    indicateurQuatreNonCalculable,
    noteIndicateurCinq,
    objectifsMesuresSchema,
  }
}

//Note: For 2022, first year of OPMC, we consider that the duration to be frozen is 2 years, but for next years, it will be 1 year like isFrozenDeclaration.
const OPMC_FROZEN_DURATION = { years: 2 }

export const isFrozenDeclarationForOPMC = (declaration?: DeclarationAPI) =>
  declaration?.declared_at ? isOlderThanTimeAgo(fromUnixTime(declaration.declared_at), OPMC_FROZEN_DURATION) : false

const ObjectifsMesuresPage: FunctionComponent<Record<string, never>> = () => {
  const history = useHistory()
  const { siren, year } = useParams<Params>()

  const { declaration, isLoading, isError } = useDeclaration(siren, Number(year))

  const isFrozenObjectifsMesures = isFrozenDeclarationForOPMC(declaration)

  const { toastSuccess, toastError } = useToastMessage({ duration: 10000 })

  if (isLoading) return <Spinner />

  if (isError)
    return (
      <>
        <Text textColor="#E53E3E">Il n'y a pas de déclaration pour ce SIREN et cette année.</Text>
        <ButtonAction onClick={() => history.goBack()} label="Retour" />
      </>
    )

  // From now on, declaration is necessarily defined, otherwise, we would have returned earlier.

  const {
    index,
    publicationSurSiteInternet,
    trancheEffectifs,
    after2021,
    initialValuesObjectifsMesures,
    noteIndicateurUn,
    indicateurUnNonCalculable,
    noteIndicateurDeux,
    indicateurDeuxNonCalculable,
    noteIndicateurTrois,
    indicateurTroisNonCalculable,
    noteIndicateurDeuxTrois,
    indicateurDeuxTroisNonCalculable,
    noteIndicateurQuatre,
    indicateurQuatreNonCalculable,
    noteIndicateurCinq,
    objectifsMesuresSchema,
  } = buildHelpersObjectifsMesures(declaration)

  const { title, warningText, legalText, finalMessage, siteWebLabel, siteWebReminder, modalite } = buildWordings(
    index,
    publicationSurSiteInternet,
  )

  // This is not supposed to happen due to routing but it is safer to guard against it.
  if (declaration?.data.déclaration.période_suffisante === false)
    return <Text>Vous n'avez pas à remplir cette page car l'entreprise n'a pas au moins 12 mois d'existence.</Text>

  if (index === undefined) return <Text>Vous n'avez pas à remplir cette page car l'index est non calculable.</Text>

  if (index > 85) return <Text>Vous n'avez pas à remplir cette page car votre index est supérieur à 85.</Text>

  const onSubmit = async (formData: typeof initialValuesObjectifsMesures) => {
    try {
      await postOpMc(siren, year, formData)
      await sendReceiptObjectifsMesures(siren, Number(year))
      toastSuccess(finalMessage)
    } catch (error) {
      console.error(
        "Erreur lors de la sauvegarde des informations d'objectifs de progression et mesures de correction",
        error,
      )
      toastError("Erreur lors de la sauvegarde des informations")
    }
  }

  return (
    <SinglePageLayout>
      <Page title={title}>
        {isFrozenObjectifsMesures && (
          <InfoBlock
            type="warning"
            title="Vos objectifs de progression et mesures de correction ne sont plus modifiables."
            text="Vos objectifs de progression et mesures de correction ne sont plus modifiables car le délai est écoulé."
            my="6"
          />
        )}
        <Form
          onSubmit={onSubmit}
          initialValues={initialValuesObjectifsMesures}
          validateOnBlur
          validate={formValidator(objectifsMesuresSchema)}
        >
          {({ handleSubmit, hasValidationErrors, submitFailed, submitting, values, errors }) => (
            <form onSubmit={handleSubmit}>
              <FormStack>
                {submitFailed && hasValidationErrors && (
                  <FormError message="Le formulaire ne peut pas être validé si tous les champs ne sont pas remplis." />
                )}

                {(index !== undefined || after2021) && (
                  <>
                    <InfoBlock type="warning" text={warningText} />

                    <LegalText>{legalText}</LegalText>

                    <Title>Objectifs de progression</Title>

                    <>
                      <LegalText>
                        Conformément à la loi n° 2020-1721 du 29 décembre 2020 de finances pour 2021 et aux articles L.
                        1142-9-1 et D. 1142-6-1 du code du travail, indiquer les objectifs de progression fixés pour
                        chaque indicateur pour lequel la note maximale n'a pas été atteinte :
                      </LegalText>

                      <RowProgression
                        valueOrigin={
                          indicateurUnNonCalculable
                            ? "NC"
                            : String(noteIndicateurUn) + "/" + MAX_NOTES_INDICATEURS["indicateurUn"]
                        }
                        fieldName="objectifIndicateurUn"
                        isReadOnly={indicateurUnNonCalculable || isFrozenObjectifsMesures}
                        isDisabled={
                          indicateurUnNonCalculable || noteIndicateurUn === MAX_NOTES_INDICATEURS["indicateurUn"]
                        }
                      >
                        Écart de rémunération
                      </RowProgression>

                      <LegalText>
                        Attention, cet objectif doit permettre d’assurer le respect des dispositions relatives à
                        l’égalité de rémunération prévues à l’article L. 3221-2 du code du travail.
                      </LegalText>

                      {trancheEffectifs === "50:250" ? (
                        <>
                          <RowProgression
                            valueOrigin={
                              indicateurDeuxTroisNonCalculable
                                ? "NC"
                                : String(noteIndicateurDeuxTrois) + "/" + MAX_NOTES_INDICATEURS["indicateurDeuxTrois"]
                            }
                            fieldName="objectifIndicateurDeuxTrois"
                            isReadOnly={indicateurDeuxTroisNonCalculable || isFrozenObjectifsMesures}
                            isDisabled={
                              indicateurDeuxTroisNonCalculable ||
                              noteIndicateurDeuxTrois === MAX_NOTES_INDICATEURS["indicateurDeuxTrois"]
                            }
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
                            isReadOnly={indicateurDeuxNonCalculable || isFrozenObjectifsMesures}
                            isDisabled={
                              indicateurDeuxNonCalculable ||
                              noteIndicateurDeux === MAX_NOTES_INDICATEURS["indicateurDeux"]
                            }
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
                            isReadOnly={indicateurTroisNonCalculable || isFrozenObjectifsMesures}
                            isDisabled={
                              indicateurTroisNonCalculable ||
                              noteIndicateurTrois === MAX_NOTES_INDICATEURS["indicateurTrois"]
                            }
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
                          isReadOnly={indicateurQuatreNonCalculable || isFrozenObjectifsMesures}
                          isDisabled={
                            indicateurQuatreNonCalculable ||
                            noteIndicateurQuatre === MAX_NOTES_INDICATEURS["indicateurQuatre"]
                          }
                        >
                          Retour de congé maternité
                        </RowProgression>
                      </>
                      <>
                        <RowProgression
                          valueOrigin={String(noteIndicateurCinq) + "/" + MAX_NOTES_INDICATEURS["indicateurCinq"]}
                          fieldName="objectifIndicateurCinq"
                          isReadOnly={isFrozenObjectifsMesures}
                          isDisabled={noteIndicateurCinq === MAX_NOTES_INDICATEURS["indicateurCinq"]}
                        >
                          Dix plus hautes rémunérations
                        </RowProgression>
                      </>
                    </>

                    <Title>Publication</Title>

                    <InputDateGroup
                      fieldName="datePublicationObjectifs"
                      label="Date de publication des objectifs de progression"
                      isReadOnly={isFrozenObjectifsMesures}
                    />

                    {index < 75 && (
                      <>
                        <InputDateGroup
                          fieldName="datePublicationMesures"
                          label="Date de publication des mesures de correction"
                          isReadOnly={isFrozenObjectifsMesures}
                        />
                      </>
                    )}

                    {publicationSurSiteInternet && (
                      <>
                        <LegalText>{siteWebReminder}</LegalText>

                        <InputGroup
                          label={siteWebLabel}
                          fieldName="lienPublication"
                          isReadOnly={true}
                          showError={false}
                        />
                      </>
                    )}

                    {/* Modalités pour objectifs et/ou les mesures */}
                    {(!publicationSurSiteInternet || index < 75) && (
                      <TextareaGroup
                        label={modalite}
                        fieldName="modalitesPublicationObjectifsMesures"
                        isReadOnly={isFrozenObjectifsMesures}
                      />
                    )}
                  </>
                )}
              </FormStack>

              <ActionBar>
                <FormSubmit label="Déclarer" loading={submitting} disabled={isFrozenObjectifsMesures} />
                <ButtonLink
                  to={`/tableauDeBord/mes-declarations/${siren}`}
                  label="Retour"
                  variant="outline"
                  colorScheme="primary"
                  size="lg"
                />
              </ActionBar>
            </form>
          )}
        </Form>
      </Page>
    </SinglePageLayout>
  )
}

export default ObjectifsMesuresPage
