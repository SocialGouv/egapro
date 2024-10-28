"use client";

import { type CodeNaf } from "@api/core-domain/infra/db/CodeNaf";
import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Highlight from "@codegouvfr/react-dsfr/Highlight";
import { CorrectiveMeasures } from "@common/core-domain/domain/valueObjects/declaration/declarationInfo/CorrectiveMeasures";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { type CompanyDTO } from "@common/core-domain/dtos/CompanyDTO";
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { formatIsoToFr } from "@common/utils/date";
import { BigNote, Box, RecapCard, RecapCardCompany } from "@design-system";
import { useRouter } from "next/navigation";

import { funnelStaticConfig } from "../../declarationFunnelConfiguration";
import { updateCompanyInfos } from "./actions";
import { RecapCardIndicator } from "./RecapCardIndicator";
import { RecapCardPublication } from "./RecapCardPublication";

type Props = { displayTitle?: string; déclaration: DeclarationDTO; edit?: boolean };

export const RecapDeclaration = ({ déclaration, edit, displayTitle }: Props) => {
  const entreprise = déclaration.entreprise?.entrepriseDéclarante;
  const router = useRouter();
  const company: CompanyDTO = {
    name: entreprise?.raisonSociale || "",
    address: entreprise?.adresse,
    postalCode: entreprise?.codePostal,
    city: entreprise?.commune,
    countryIsoCode: entreprise?.codePays,
    siren: entreprise?.siren || "",
    nafCode: entreprise?.codeNaf as CodeNaf,
    workforce: {
      range: déclaration.entreprise?.tranche,
    },
    ues: {
      name: déclaration.ues?.nom || "",
      companies:
        déclaration.ues?.entreprises?.map(company => ({
          name: company.raisonSociale || "",
          siren: company.siren || "",
        })) || [],
    },
  };

  const year = déclaration.commencer?.annéeIndicateurs || 2023;

  const onSubmit = async (data: CompanyDTO) => {
    const newFormData: DeclarationDTO = {
      ...déclaration,
      entreprise: {
        ...déclaration.entreprise,
        entrepriseDéclarante: {
          ...déclaration.entreprise?.entrepriseDéclarante,
          raisonSociale: data.name,
          codeNaf: data.nafCode,
          siren: data.siren,
          commune: data.city,
          codePostal: data.postalCode,
          adresse: data.address ?? "",
          département: data.county,
          région: data.region,
        },
      },
    };
    const isEditingSiren = data.siren != déclaration.entreprise?.entrepriseDéclarante?.siren;

    const { ok } = await updateCompanyInfos(
      newFormData,
      isEditingSiren ? déclaration.entreprise?.entrepriseDéclarante?.siren : void 0,
    );
    if (!ok)
      return alert(
        "Une erreur est survenue lors de la sauvegarde des informations de l'entreprise, veuillez réessayer.",
      );

    if (isEditingSiren) {
      router.push(`/index-egapro/declaration/${data.siren}/${déclaration.commencer?.annéeIndicateurs}`);
    }
    router.refresh();
  };

  return (
    <>
      <h1 className={fr.cx("fr-mt-4w")}>Récapitulatif de l'Index égalité professionnelle</h1>
      <Highlight>
        Déclaration de l'index de l'égalité professionnelle Femmes/Hommes pour l'année <strong>{year + 1}</strong> au
        titre des données <strong>{year}</strong>.
      </Highlight>
      {/* {meta?.date && <RecapCard title="Date de déclaration" content={meta?.date && formatIsoToFr(meta?.date)} />}  */}

      {déclaration["declaration-existante"].status == "consultation" &&
        déclaration["declaration-existante"].date &&
        déclaration["declaration-existante"].modifiedAt && (
          <Box className="text-right" mb="2v">
            <Badge severity="info" noIcon small>
              Déclarée le {formatIsoToFr(déclaration["declaration-existante"].date)}
            </Badge>{" "}
            <Badge severity="info" noIcon small>
              Modifiée le {formatIsoToFr(déclaration["declaration-existante"].modifiedAt)}
            </Badge>
          </Box>
        )}

      <RecapCard
        title="Informations déclarant"
        editLink={(edit || void 0) && funnelStaticConfig["declarant"].url}
        content={
          <>
            <strong>
              {déclaration.declarant?.nom}&nbsp;{déclaration.declarant?.prénom}
            </strong>
            <br />
            {déclaration.declarant?.email}
            <br />
            {déclaration.declarant?.téléphone}
          </>
        }
      />

      <RecapCardCompany edit={edit} company={company} title="Informations Entreprise / UES" onSubmit={onSubmit} />
      {company.ues?.name && (
        <RecapCard
          title="Informations UES"
          editLink={(edit || void 0) && funnelStaticConfig["ues"].url}
          content={
            <>
              <p>
                Nom de l'UES : <strong>{company.ues.name}</strong>
              </p>
              <p>
                Nombre d'entreprises composant l'UES : <strong>{company.ues.companies?.length + 1}</strong>
              </p>
            </>
          }
        />
      )}

      <RecapCard
        title="Informations calcul et période de référence"
        editLink={(edit || void 0) && funnelStaticConfig["periode-reference"].url}
        content={
          <>
            <p>
              Les indicateurs sont calculés au titre de l’année <strong>{year}</strong>
            </p>

            {déclaration["periode-reference"]?.périodeSuffisante === "oui" ? (
              <>
                <p>
                  La date de fin de la période de référence choisie pour le calcul des indicateurs est le&nbsp;
                  <strong>
                    {déclaration["periode-reference"].finPériodeRéférence &&
                      formatIsoToFr(déclaration["periode-reference"].finPériodeRéférence)}
                  </strong>
                  .
                </p>
                <p>
                  {déclaration["periode-reference"].effectifTotal >= 0 && (
                    <>
                      <strong>{déclaration["periode-reference"].effectifTotal}</strong> salarié
                      {déclaration["periode-reference"].effectifTotal > 1 ? "s" : ""} pris en compte pour le calcul des
                      indicateurs sur la période de référence (en effectif physique)
                    </>
                  )}
                </p>
              </>
            ) : (
              <p>
                Vous ne disposez pas d'une période de référence de 12 mois consécutifs, votre index et vos indicateurs
                ne sont pas calculables
              </p>
            )}
          </>
        }
      />

      {déclaration["periode-reference"]?.périodeSuffisante === "oui" && (
        <>
          <RecapCardIndicator
            déclaration={déclaration}
            name="remunerations"
            edit={edit}
            customContent={
              <>
                {déclaration.remunerations?.estCalculable === "oui" && déclaration.remunerations?.mode && (
                  <p>
                    La modalité choisie pour le calcul de l'indicateur est{" "}
                    {new RemunerationsMode(déclaration.remunerations?.mode).getLabel().toLowerCase()}.
                  </p>
                )}

                {déclaration.remunerations?.estCalculable === "oui" && déclaration.remunerations?.mode !== "csp" && (
                  <>
                    {!déclaration.remunerations?.dateConsultationCSE ? (
                      <p> Aucun CSE n’est mis en place</p>
                    ) : (
                      <p>Le CSE a été consulté le {formatIsoToFr(déclaration.remunerations.dateConsultationCSE)}</p>
                    )}
                  </>
                )}
              </>
            }
          />

          {déclaration["entreprise"]?.tranche === "50:250" ? (
            <RecapCardIndicator déclaration={déclaration} edit={edit} name="augmentations-et-promotions" />
          ) : (
            <>
              <RecapCardIndicator déclaration={déclaration} edit={edit} name="augmentations" />
              <RecapCardIndicator déclaration={déclaration} edit={edit} name="promotions" />
            </>
          )}
          <RecapCardIndicator déclaration={déclaration} edit={edit} name="conges-maternite" />
          <RecapCardIndicator déclaration={déclaration} edit={edit} name="hautes-remunerations" />
        </>
      )}

      <RecapCard
        title="Index égalité professionnelle"
        content={
          <BigNote
            noBorder
            note={déclaration["resultat-global"]?.index}
            max={100}
            legend={déclaration["resultat-global"]?.index !== undefined ? "Index de" : "Index non calculable"}
            text={
              <>
                <p>
                  Total des points obtenus aux indicateurs calculables&nbsp;:{" "}
                  <strong>{déclaration["resultat-global"]?.points}</strong>
                </p>
                <p>
                  Nombre de points maximum pouvant être obtenus aux indicateurs calculables&nbsp;:{" "}
                  <strong>{déclaration["resultat-global"]?.pointsCalculables}</strong>
                </p>
                {déclaration["resultat-global"]?.mesures && (
                  <p>
                    Mesures de correction prévues à l'article D. 1142-6:{" "}
                    <i>{CorrectiveMeasures.Label[déclaration["resultat-global"]?.mesures]}</i>
                  </p>
                )}
              </>
            }
          />
        }
      />

      <RecapCardPublication edit={edit} publication={déclaration.publication} />

      {year > 2020 && déclaration["periode-reference"]?.périodeSuffisante === "oui" && (
        <RecapCard
          title="Plan de relance"
          editLink={(edit || void 0) && funnelStaticConfig["publication"].url}
          content={
            <p>
              {déclaration.entreprise?.type === "ues"
                ? "Une ou plusieurs entreprises comprenant au moins 50 salariés au sein de l'UES "
                : "Votre entreprise "}
              {déclaration.publication?.planRelance === "oui" ? "a" : "n'a pas"} bénéficié depuis 2021, d'une aide
              prévue par la loi du 29 décembre 2020 de finances pour 2021 au titre de la mission « Plan de relance »
            </p>
          }
        />
      )}
    </>
  );
};
