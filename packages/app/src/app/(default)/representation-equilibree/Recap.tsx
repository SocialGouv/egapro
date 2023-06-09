import { type Entreprise } from "@api/core-domain/infra/services/IEntrepriseService";
import { NotComputableReasonExecutiveRepEq } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonExecutiveRepEq";
import { NotComputableReasonMemberRepEq } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonMemberRepEq";
import { type RepresentationEquilibreeDTO } from "@common/core-domain/dtos/RepresentationEquilibreeDTO";
import { getAdditionalMeta } from "@common/core-domain/helpers/entreprise";
import { COUNTRIES_ISO_TO_LIB, DEFAULT_COUNTY_CODE } from "@common/dict";
import { formatIsoToFr } from "@common/utils/date";
import { RecapCard } from "@design-system";

export interface DetailRepEqProps {
  company: Entreprise;
  edit?: boolean;
  repEq: RepresentationEquilibreeDTO;
}
export const DetailRepEq = ({ repEq, company, edit }: DetailRepEqProps) => {
  const { address, countryCode, postalCode } = getAdditionalMeta(company);

  return (
    <>
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
      <RecapCard
        title="Informations entreprise"
        content={
          <>
            <strong>{company.simpleLabel}</strong>
            <br />
            {address}, {postalCode} {company.firstMatchingEtablissement.libelleCommuneEtablissement}
            {countryCode !== DEFAULT_COUNTY_CODE && `, ${COUNTRIES_ISO_TO_LIB[countryCode]}`}
            <br />
            Siren : {repEq.siren} - Code NAF : {company.activitePrincipaleUniteLegale} - {company.activitePrincipale}
          </>
        }
      />
      <RecapCard
        title="Période de référence"
        editLink={(edit || void 0) && "/representation-equilibree/periode-reference"}
        content={
          <>
            Année au titre de laquelle les écarts sont calculés : <strong>{repEq.year}</strong>
            <br />
            Date de fin de la période de douze (12) mois consécutifs correspondant à l'exercice comptable pour le calcul
            des écarts : <strong>{formatIsoToFr(repEq.endOfPeriod)}</strong>
          </>
        }
      />
      <RecapCard
        title="Écart de représentation parmi les cadres dirigeants"
        editLink={(edit || void 0) && "/representation-equilibree/ecarts-cadres"}
        stats={
          "notComputableReasonExecutives" in repEq
            ? [
                {
                  text: (
                    <>
                      Motif de non calculabilité :<br />
                      <strong>{NotComputableReasonExecutiveRepEq.Label[repEq.notComputableReasonExecutives]}</strong>
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
        title="Écart de représentation parmi les membres des instances dirigeantes"
        editLink={(edit || void 0) && "/representation-equilibree/ecarts-membres"}
        stats={
          "notComputableReasonMembers" in repEq
            ? [
                {
                  text: (
                    <>
                      Motif de non calculabilité :<br />
                      <strong>{NotComputableReasonMemberRepEq.Label[repEq.notComputableReasonMembers]}</strong>
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
      <RecapCard
        title="Publication de vos écarts"
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
    </>
  );
};
