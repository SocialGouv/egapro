"use client";
import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { NotComputableReasonExecutiveRepEq } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonExecutiveRepEq";
import { NotComputableReasonMemberRepEq } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonMemberRepEq";
import { type CompanyDTO } from "@common/core-domain/dtos/CompanyDTO";
import { type RepresentationEquilibreeDTO } from "@common/core-domain/dtos/RepresentationEquilibreeDTO";
import { formatIsoToFr } from "@common/utils/date";
import { RecapCard, RecapCardCompany } from "@design-system";

export interface DetailRepEqProps {
  edit?: boolean;
  publicMode?: boolean;
  repEq: RepresentationEquilibreeDTO;
}

// TODO: update RepresentationEquilibreeDTO to use CompanyProps instead.
const buildCompanyFromRepeq = (repEq: RepresentationEquilibreeDTO): CompanyDTO => {
  const { address, city, countryCode, nafCode, name, postalCode } = repEq.company;
  const siren = repEq.siren;

  return {
    address,
    city,
    countryIsoCode: countryCode,
    nafCode: nafCode,
    name,
    postalCode: postalCode,
    siren,
  };
};

export const DetailRepEq = ({ repEq, edit, publicMode }: DetailRepEqProps) => {
  return (
    <>
      {!publicMode && (
        <RecapCard
          title="Informations déclarant"
          editLink={(edit || void 0) && "/representation-equilibree/declarant"}
          content={
            <>
              <strong>
                {repEq.lastname} {repEq.firstname}
              </strong>
              <br />
              {repEq.email}
              <br />
              {repEq.phoneNumber}
            </>
          }
        />
      )}

      <RecapCardCompany mode="admin" company={buildCompanyFromRepeq(repEq)} />

      {!publicMode && (
        <RecapCard
          title="Période de référence"
          editLink={(edit || void 0) && "/representation-equilibree/periode-reference"}
          content={
            <>
              Année au titre de laquelle les écarts sont calculés : <strong>{repEq.year}</strong>
              <br />
              Date de fin de la période de douze (12) mois consécutifs correspondant à l'exercice comptable pour le
              calcul des écarts : <strong>{formatIsoToFr(repEq.endOfPeriod)}</strong>
            </>
          }
        />
      )}
      <RecapCard
        title="Écarts de représentation parmi les cadres dirigeants"
        editLink={(edit || void 0) && "/representation-equilibree/ecarts-cadres"}
        stats={
          "notComputableReasonExecutives" in repEq
            ? [
                {
                  text: (
                    <>
                      Les écarts ne sont pas calculables
                      <br />
                      <p className={cx(fr.cx("fr-text--sm"))}>
                        <i>{NotComputableReasonExecutiveRepEq.Label[repEq.notComputableReasonExecutives]}</i>
                      </p>
                    </>
                  ),
                  value: "NC",
                },
              ]
            : [
                {
                  text: "Pourcentage de femmes",
                  value: `${repEq.executiveWomenPercent}%`,
                },
                {
                  text: "Pourcentage d'hommes",
                  value: `${repEq.executiveMenPercent}%`,
                },
              ]
        }
      />
      <RecapCard
        title="Écarts de représentation parmi les membres des instances dirigeantes"
        editLink={(edit || void 0) && "/representation-equilibree/ecarts-membres"}
        stats={
          "notComputableReasonMembers" in repEq
            ? [
                {
                  text: (
                    <>
                      Les écarts ne sont pas calculables
                      <br />
                      <p className={cx(fr.cx("fr-text--sm"))}>
                        <i>{NotComputableReasonMemberRepEq.Label[repEq.notComputableReasonMembers]}</i>
                      </p>
                    </>
                  ),
                  value: "NC",
                },
              ]
            : [
                {
                  text: "Pourcentage de femmes",
                  value: `${repEq.memberWomenPercent}%`,
                },
                {
                  text: "Pourcentage d'hommes",
                  value: `${repEq.memberMenPercent}%`,
                },
              ]
        }
      />
      {!publicMode && repEq.publishDate && (
        <RecapCard
          title="Publication des écarts de représentation"
          editLink={(edit || void 0) && "/representation-equilibree/publication"}
          content={
            <>
              Résultats publiés le {formatIsoToFr(repEq.publishDate)}
              <br />
              {"publishUrl" in repEq ? (
                `Via le site internet suivant : ${repEq.publishUrl}`
              ) : (
                <>
                  Via les modalités de communication suivantes :<br />
                  {repEq.publishModalities}
                </>
              )}
            </>
          }
        />
      )}
    </>
  );
};
