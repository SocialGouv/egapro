"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Input from "@codegouvfr/react-dsfr/Input";
import { indicatorNoteMax } from "@common/core-domain/computers/DeclarationComputer";
import { type DeclarationOpmcDTO } from "@common/core-domain/dtos/DeclarationOpmcDTO";
import { type UpdateOpMcDTO } from "@common/core-domain/dtos/UpdateOpMcDTO";
import { formatDateToFr, parseDate } from "@common/utils/date";
import { TextareaCounter } from "@components/RHF/TextAreaCounter";
import { BackNextButtonsGroup, Grid, GridCol, Heading, Text } from "@design-system";
import { AlertMessageWithProvider, useMessageProvider } from "@design-system/client";
import { zodResolver } from "@hookform/resolvers/zod";
import assert from "assert";
import { add, isBefore } from "date-fns";
import { useRouter } from "next/navigation";
import { type PropsWithChildren } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { updateDeclarationOpmc } from "../../actions";

const required_error = "Ce champ ne peut être vide";

/**
 * Zod validator for an objective indicator.
 *
 * @param originValue The actual value for this indicator.
 * @param max The maximum value for this in ddicator.
 * @param nonCalculable If true, the value is not calculable.
 */
export const objectifValidator = (originValue: number, max: number, calculable = true): z.ZodString | z.ZodUndefined =>
  !calculable || originValue === max
    ? z.undefined()
    : z
        .string({
          required_error,
        })
        .min(1, { message: required_error })
        .max(300, { message: "L'objectif doit être un texte de 300 caractères max." });

/**
 * Zod validator in relation to the publication dates and the end of reference period.
 */
const isDateBeforeFinPeriodeReference = (finPeriodeReference: Date) =>
  z
    .string({ required_error })
    .min(1, { message: required_error })
    .superRefine((val, ctx) => {
      if (!finPeriodeReference) return;

      if (val === "" || val === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: required_error,
        });

        return z.NEVER;
      }
      let parsedDatePublication;
      try {
        parsedDatePublication = parseDate(val);
      } catch (error: unknown) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La date de publication est invalide",
        });
        return z.NEVER;
      }

      if (parsedDatePublication < finPeriodeReference) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `La date ne peut précéder la date de fin de la période de référence choisie pour le calcul de votre index (${formatDateToFr(
            finPeriodeReference,
          )})`,
        });
      }
    });

type RowProgressionProps = {
  children: string;
  fieldName: string;
  isDisabled: boolean;
  readOnly: boolean;
  valueOrigin: string;
};

const RowProgression = ({
  children,
  valueOrigin,
  fieldName,
  readOnly = false,
  isDisabled = false,
}: PropsWithChildren<RowProgressionProps>) => {
  return (
    <>
      <Grid className={fr.cx("fr-mt-4w")}>
        <GridCol sm={3} />
        <GridCol sm={1}>
          <Text variant={["sm"]} text="Actuel" />
        </GridCol>
        <GridCol sm={8}>
          <Text variant={["sm"]} text="Objectif" />
        </GridCol>
      </Grid>

      <Grid>
        <GridCol sm={3}>{children}</GridCol>
        <GridCol sm={1}>
          <span className="text-center">{valueOrigin}</span>
        </GridCol>
        <GridCol sm={8}>
          {!isDisabled ? (
            <TextareaCounter
              label=""
              fieldName={fieldName}
              readOnly={readOnly}
              disabled={isDisabled}
              maxLength={300}
              showRemainingCharacters
              placeholder="Votre objectif en 300 caractères maximum"
            />
          ) : (
            "✅ Pas d'objectif à renseigner."
          )}
        </GridCol>
      </Grid>
    </>
  );
};

function buildWordings(index: number | undefined, publicationSurSiteInternet: boolean) {
  const title =
    index !== undefined && index < 75
      ? "Déclaration des objectifs de progression et des mesures de correction"
      : "Déclaration des objectifs de progression";

  const warningText =
    index !== undefined && index < 75
      ? "Votre index étant inférieur à 75, veuillez renseigner les informations suivantes."
      : "Votre index étant inférieur à 85, veuillez renseigner les informations suivantes.";

  const legalText =
    index !== undefined && index < 75
      ? "Conformément à l’article 13 de la loi n° 2021-1774 du 24 décembre 2021 visant à accélérer l’égalité économique et professionnelle et au décret n° 2022-243 du 25 février 2022, les entreprises ayant obtenu un Index inférieur à 75 points doivent publier, par une communication externe et au sein de l’entreprise, les mesures de correction qu’elles ont définies par accord ou, à défaut, par décision unilatérale. Par ailleurs, celles ayant obtenu un Index inférieur à 85 points doivent fixer, également par accord ou, à défaut, par décision unilatérale, et publier des objectifs de progression de chacun des indicateurs de l’Index. Une fois l’accord ou la décision déposé, les informations relatives aux mesures de correction, les objectifs de progression ainsi que leurs modalités de publication doivent être transmis aux services du ministre chargé du travail et au comité social et économique."
      : "Conformément à l’article 13 de la loi n° 2021-1774 du 24 décembre 2021 visant à accélérer l’égalité économique et professionnelle et au décret n° 2022-243 du 25 février 2022, les entreprises ayant obtenu un Index inférieur à 85 points doivent fixer par accord ou, à défaut, par décision unilatérale, et publier des objectifs de progression de chacun des indicateurs de l’Index. Une fois l’accord ou la décision déposé, les objectifs de progression ainsi que leurs modalités de publication doivent être transmis aux services du ministre chargé du travail et au comité social et économique.";

  const finalMessage =
    index !== undefined && index < 75
      ? "Vous venez de transmettre aux services du ministre chargé du travail vos objectifs de progression et mesures de correction"
      : "Vous venez de transmettre aux services du ministre chargé du travail vos objectifs de progression";

  const siteWebLabel =
    index !== undefined && index < 75
      ? "Adresse exacte de la page Internet (URL) sur laquelle devront être publiés les objectifs de progression et les mesures de correction"
      : "Adresse exacte de la page Internet (URL) sur laquelle devront être publiés les objectifs de progression";

  const siteWebReminder =
    index !== undefined && index < 75
      ? "Pour rappel, les objectifs de progression et les mesures de correction doivent être publiés sur la même page du site internet que celle où figurent les résultats obtenus à chacun des indicateurs et le niveau de résultat à l'Index."
      : "Pour rappel, les objectifs de progression doivent être publiés sur la même page du site internet que celle où figurent les résultats obtenus à chacun des indicateurs et le niveau de résultat à l'Index.";

  let modalite = "";

  if (index !== undefined) {
    if (!publicationSurSiteInternet) {
      if (index >= 75 && index < 85)
        modalite = "Préciser les modalités de communication des objectifs de progression auprès de vos salariés.";
      else if (index < 75)
        modalite =
          "Préciser les modalités de communication des objectifs de progression et des mesures de correction auprès de vos salariés.";
    } else {
      if (index < 75)
        modalite = "Préciser les modalités de communication des mesures de correction auprès de vos salariés.";
    }
  }

  return { title, warningText, legalText, finalMessage, siteWebLabel, siteWebReminder, modalite };
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
export function buildHelpersObjectifsMesures(declaration?: DeclarationOpmcDTO) {
  assert(
    declaration?.["periode-reference"]?.périodeSuffisante === "oui",
    "La page des OP/MC n'est accessible que pour les déclarations d'entreprise qui ont au moins 12 mois d'existence.",
  );

  const index = declaration?.["resultat-global"]?.index;
  const publicationSurSiteInternet = declaration?.publication?.choixSiteWeb === "oui";

  const trancheEffectifs = declaration?.entreprise?.tranche;

  const after2021 = declaration?.commencer?.annéeIndicateurs && declaration.commencer.annéeIndicateurs >= 2021;

  const initialValuesObjectifsMesures = {
    objectifIndicateurUn: declaration?.opmc?.objectifIndicateurRemunerations,
    objectifIndicateurDeux: declaration?.opmc?.objectifIndicateurAugmentations,
    objectifIndicateurTrois: declaration?.opmc?.objectifIndicateurPromotions,
    objectifIndicateurDeuxTrois: declaration?.opmc?.objectifIndicateurAugmentationsPromotions,
    objectifIndicateurQuatre: declaration?.opmc?.objectifIndicateurCongesMaternites,
    objectifIndicateurCinq: declaration?.opmc?.objectifIndicateurHautesRemunerations,
    datePublicationMesures: declaration?.opmc?.datePublicationMesures,
    datePublicationObjectifs: declaration?.opmc?.datePublicationObjectifs,
    modalitesPublicationObjectifsMesures: declaration?.opmc?.modalitesPublicationObjectifsMesures,
    lienPublication: (declaration?.publication?.choixSiteWeb === "oui" && declaration.publication.url) || undefined,
  };

  const [noteIndicateurUn, indicateurUnCalculable] =
    declaration?.remunerations?.estCalculable === "oui"
      ? [declaration?.["remunerations-resultat"]?.note, true]
      : [undefined, false];

  const [noteIndicateurDeux, indicateurDeuxCalculable] =
    declaration?.augmentations?.estCalculable === "oui"
      ? [declaration["augmentations"].note, true]
      : [undefined, false];

  const [noteIndicateurTrois, indicateurTroisCalculable] =
    declaration?.promotions?.estCalculable === "oui" ? [declaration["promotions"].note, true] : [undefined, false];

  const [noteIndicateurDeuxTrois, indicateurDeuxTroisCalculable] =
    declaration?.["augmentations-et-promotions"]?.estCalculable === "oui"
      ? [declaration["augmentations-et-promotions"].note, true]
      : [undefined, false];

  const [noteIndicateurQuatre, indicateurQuatreCalculable] =
    declaration?.["conges-maternite"]?.estCalculable === "oui"
      ? [declaration["conges-maternite"].note, true]
      : [undefined, false];

  const noteIndicateurCinq = declaration?.["hautes-remunerations"]?.note;

  const parsedFinPeriodeReference = parseDate(declaration["periode-reference"].finPériodeRéférence);

  // Beginning of zod validation schema
  let augmentationInputs: Record<string, unknown> = {
    objectifIndicateurDeuxTrois: objectifValidator(
      noteIndicateurDeuxTrois || 0,
      indicatorNoteMax["augmentations-et-promotions"],
      indicateurDeuxTroisCalculable,
    ),
  };
  if (trancheEffectifs !== "50:250") {
    augmentationInputs = {
      objectifIndicateurDeux: objectifValidator(
        noteIndicateurDeux || 0,
        indicatorNoteMax.augmentations,
        indicateurDeuxCalculable,
      ),
      objectifIndicateurTrois: objectifValidator(
        noteIndicateurTrois || 0,
        indicatorNoteMax.promotions,
        indicateurTroisCalculable,
      ),
    };
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
            indicatorNoteMax.remunerations,
            indicateurUnCalculable,
          ),
          ...augmentationInputs,
          objectifIndicateurQuatre: objectifValidator(
            noteIndicateurQuatre || 0,
            indicatorNoteMax["conges-maternite"],
            indicateurQuatreCalculable,
          ),
          objectifIndicateurCinq: objectifValidator(noteIndicateurCinq || 0, indicatorNoteMax["hautes-remunerations"]),
          datePublicationObjectifs: isDateBeforeFinPeriodeReference(parsedFinPeriodeReference),
          datePublicationMesures: isDateBeforeFinPeriodeReference(parsedFinPeriodeReference).optional(),
          modalitesPublicationObjectifsMesures: z.string().optional(),
        })
        .refine(
          val =>
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
          val => {
            return !index
              ? true
              : index < 75
              ? val.datePublicationMesures !== undefined
              : val.datePublicationMesures === undefined;
          },
          {
            message: required_error,
            path: ["datePublicationMesures"],
          },
        );

  return {
    index,
    publicationSurSiteInternet,
    trancheEffectifs,
    after2021,
    initialValuesObjectifsMesures,
    noteIndicateurUn,
    indicateurUnCalculable,
    noteIndicateurDeux,
    indicateurDeuxCalculable,
    noteIndicateurTrois,
    indicateurTroisCalculable,
    noteIndicateurDeuxTrois,
    indicateurDeuxTroisCalculable,
    noteIndicateurQuatre,
    indicateurQuatreCalculable,
    noteIndicateurCinq,
    objectifsMesuresSchema,
  };
}

export const isEditable = (declaration?: DeclarationOpmcDTO) =>
  declaration?.["declaration-existante"].date
    ? isBefore(new Date(), add(new Date(declaration?.["declaration-existante"].date), { years: 1 }))
    : false;

type Props = {
  declaration: DeclarationOpmcDTO;
};

export const ObjectifsMesuresForm = ({ declaration }: Props) => {
  const router = useRouter();
  const { setMessage } = useMessageProvider();

  const {
    index,
    publicationSurSiteInternet,
    trancheEffectifs,
    after2021,
    initialValuesObjectifsMesures,
    noteIndicateurUn,
    indicateurUnCalculable,
    noteIndicateurDeux,
    indicateurDeuxCalculable,
    noteIndicateurTrois,
    indicateurTroisCalculable,
    noteIndicateurDeuxTrois,
    indicateurDeuxTroisCalculable,
    noteIndicateurQuatre,
    indicateurQuatreCalculable,
    noteIndicateurCinq,
    objectifsMesuresSchema,
  } = buildHelpersObjectifsMesures(declaration);

  const { title, legalText, finalMessage, siteWebLabel, siteWebReminder, modalite } = buildWordings(
    index,
    publicationSurSiteInternet,
  );

  const methods = useForm<UpdateOpMcDTO>({
    mode: "onChange",
    resolver: zodResolver(objectifsMesuresSchema),
    defaultValues: {
      datePublicationMesures: declaration.opmc?.datePublicationMesures,
      datePublicationObjectifs: declaration.opmc?.datePublicationObjectifs,
      modalitesPublicationObjectifsMesures: declaration.opmc?.modalitesPublicationObjectifsMesures,
      objectifIndicateurUn: declaration.opmc?.objectifIndicateurRemunerations,
      objectifIndicateurDeux: declaration.opmc?.objectifIndicateurAugmentations,
      objectifIndicateurTrois: declaration.opmc?.objectifIndicateurPromotions,
      objectifIndicateurDeuxTrois: declaration.opmc?.objectifIndicateurAugmentationsPromotions,
      objectifIndicateurQuatre: declaration.opmc?.objectifIndicateurCongesMaternites,
      objectifIndicateurCinq: declaration.opmc?.objectifIndicateurHautesRemunerations,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { isValid, errors },
  } = methods;

  const [siren, year] = [declaration.commencer?.siren, declaration.commencer?.annéeIndicateurs];

  assert(siren, "Le siren est obligatoire");
  assert(year, "L'année est obligatoire");

  const isReadonly = !isEditable(declaration);

  const onSubmit = async (opmc: UpdateOpMcDTO) => {
    const result = await updateDeclarationOpmc({ opmc, siren, year });

    if (result.ok) {
      setMessage({ text: finalMessage, severity: "success" });
    } else {
      setMessage({ text: result.error || "Erreur lors de la sauvegarde des informations", severity: "error" });
    }
  };

  return (
    <FormProvider {...methods}>
      {isReadonly && (
        <Alert
          severity="warning"
          title="Vos objectifs de progression et mesures de correction ne sont plus modifiables."
          description="Vos objectifs de progression et mesures de correction ne sont plus modifiables car le délai est écoulé."
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {(index !== undefined || after2021) && (
          <>
            <AlertMessageWithProvider />

            <Heading as="h2" text={title} />

            <p className={fr.cx("fr-mt-4w", "fr-text--xs")}>{legalText}</p>

            <>
              <p className={fr.cx("fr-text--xs")}>
                Conformément à la loi n° 2020-1721 du 29 décembre 2020 de finances pour 2021 et aux articles L. 1142-9-1
                et D. 1142-6-1 du code du travail, indiquer les objectifs de progression fixés pour chaque indicateur
                pour lequel la note maximale n'a pas été atteinte.
              </p>

              <RowProgression
                valueOrigin={
                  !indicateurUnCalculable ? "NC" : String(noteIndicateurUn) + "/" + indicatorNoteMax.remunerations
                }
                fieldName="objectifIndicateurUn"
                readOnly={!indicateurUnCalculable || isReadonly || noteIndicateurUn === indicatorNoteMax.remunerations}
                isDisabled={!indicateurUnCalculable || noteIndicateurUn === indicatorNoteMax.remunerations}
              >
                Écart de rémunération
              </RowProgression>

              <div className={fr.cx("fr-mb-8w")}>
                <Text
                  variant={["sm"]}
                  text="Attention, cet objectif doit permettre d’assurer le respect des dispositions relatives à l’égalité de
                rémunération prévues à l’article L. 3221-2 du code du travail."
                />
              </div>

              {trancheEffectifs === "50:250" ? (
                <>
                  <RowProgression
                    valueOrigin={
                      !indicateurDeuxTroisCalculable
                        ? "NC"
                        : String(noteIndicateurDeuxTrois) + "/" + indicatorNoteMax["augmentations-et-promotions"]
                    }
                    fieldName="objectifIndicateurDeuxTrois"
                    readOnly={
                      !indicateurDeuxTroisCalculable ||
                      isReadonly ||
                      noteIndicateurDeuxTrois === indicatorNoteMax["augmentations-et-promotions"]
                    }
                    isDisabled={
                      !indicateurDeuxTroisCalculable ||
                      noteIndicateurDeuxTrois === indicatorNoteMax["augmentations-et-promotions"]
                    }
                  >
                    Écart de taux d'augmentations individuelles
                  </RowProgression>
                </>
              ) : (
                <>
                  <RowProgression
                    valueOrigin={
                      !indicateurDeuxCalculable
                        ? "NC"
                        : String(noteIndicateurDeux) + "/" + indicatorNoteMax["augmentations"]
                    }
                    fieldName="objectifIndicateurDeux"
                    readOnly={
                      !indicateurDeuxCalculable ||
                      isReadonly ||
                      noteIndicateurDeux === indicatorNoteMax["augmentations"]
                    }
                    isDisabled={!indicateurDeuxCalculable || noteIndicateurDeux === indicatorNoteMax["augmentations"]}
                  >
                    Écart de taux d'augmentations individuelles
                  </RowProgression>

                  <RowProgression
                    valueOrigin={
                      !indicateurTroisCalculable
                        ? "NC"
                        : String(noteIndicateurTrois) + "/" + indicatorNoteMax.promotions
                    }
                    fieldName="objectifIndicateurTrois"
                    readOnly={
                      !indicateurTroisCalculable || isReadonly || noteIndicateurTrois === indicatorNoteMax.promotions
                    }
                    isDisabled={!indicateurTroisCalculable || noteIndicateurTrois === indicatorNoteMax.promotions}
                  >
                    Écart de taux de promotions
                  </RowProgression>
                </>
              )}
              <>
                <RowProgression
                  valueOrigin={
                    !indicateurQuatreCalculable
                      ? "NC"
                      : String(noteIndicateurQuatre) + "/" + indicatorNoteMax["conges-maternite"]
                  }
                  fieldName="objectifIndicateurQuatre"
                  readOnly={
                    !indicateurQuatreCalculable ||
                    isReadonly ||
                    noteIndicateurQuatre === indicatorNoteMax["conges-maternite"]
                  }
                  isDisabled={
                    !indicateurQuatreCalculable || noteIndicateurQuatre === indicatorNoteMax["conges-maternite"]
                  }
                >
                  Retour de congé maternité
                </RowProgression>
              </>
              <>
                <RowProgression
                  valueOrigin={String(noteIndicateurCinq) + "/" + indicatorNoteMax["hautes-remunerations"]}
                  fieldName="objectifIndicateurCinq"
                  readOnly={isReadonly || noteIndicateurCinq === indicatorNoteMax["hautes-remunerations"]}
                  isDisabled={noteIndicateurCinq === indicatorNoteMax["hautes-remunerations"]}
                >
                  Dix plus hautes rémunérations
                </RowProgression>
              </>
            </>

            <Heading as="h3" text="Publication" className={fr.cx("fr-mt-6w")} />

            <Input
              nativeInputProps={{
                ...register("datePublicationObjectifs"),
                type: "date",
                readOnly: isReadonly ?? false,
              }}
              label="Date de publication des objectifs de progression"
              state={errors["datePublicationObjectifs"] && "error"}
              stateRelatedMessage={errors["datePublicationObjectifs"]?.message as string}
            />

            {index && index < 75 && (
              <>
                <Input
                  nativeInputProps={{
                    ...register("datePublicationMesures"),
                    type: "date",
                    readOnly: isReadonly ?? false,
                  }}
                  label="Date de publication des mesures de correction"
                  state={errors["datePublicationMesures"] && "error"}
                  stateRelatedMessage={errors["datePublicationMesures"]?.message as string}
                />
              </>
            )}

            {publicationSurSiteInternet && (
              <>
                <p className={fr.cx("fr-mt-6w")}>{siteWebReminder}</p>

                <Input
                  nativeInputProps={{
                    readOnly: true,
                    disabled: true,
                    value: initialValuesObjectifsMesures.lienPublication,
                  }}
                  label={siteWebLabel}
                />
              </>
            )}

            {/* Modalités pour objectifs et/ou les mesures */}
            {(!publicationSurSiteInternet || (index && index < 75)) && (
              <Input
                nativeTextAreaProps={{
                  ...register("modalitesPublicationObjectifsMesures"),
                  readOnly: isReadonly,
                }}
                label={modalite}
                textArea
                state={errors["modalitesPublicationObjectifsMesures"] && "error"}
                stateRelatedMessage={errors["modalitesPublicationObjectifsMesures"]?.message as string}
              />
            )}
          </>
        )}

        <BackNextButtonsGroup
          className={fr.cx("fr-my-6w")}
          backProps={{
            onClick: () => router.push("/"),
          }}
          backIcon={false}
          backLabel="Annuler"
          nextLabel="Enregistrer"
          nextDisabled={!isValid || isReadonly}
          nextIcon={false}
        />
      </form>
    </FormProvider>
  );
};
