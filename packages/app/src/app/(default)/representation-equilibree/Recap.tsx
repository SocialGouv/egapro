import { NotComputableReasonExecutiveRepEq } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonExecutiveRepEq";
import { NotComputableReasonMemberRepEq } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonMemberRepEq";
import { type RepresentationEquilibreeDTO } from "@common/core-domain/dtos/RepresentationEquilibreeDTO";
import { formatIsoToFr } from "@common/utils/date";
import { RecapCard } from "@design-system";
import { RecapCardCompany } from "packages/app/src/design-system/base/client/RecapCardCompany";

export interface DetailRepEqProps {
  edit?: boolean;
  publicMode?: boolean;
  repEq: RepresentationEquilibreeDTO;
}
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

      <RecapCardCompany company={repEq.company} />

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
      {!publicMode && repEq.publishDate && (
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
      )}
    </>
  );
};
