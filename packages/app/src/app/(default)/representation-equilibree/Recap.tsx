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
  // Afficher l'objet company pour déboguer
  console.log("repEq.company:", repEq.company);

  const { address, city, countryCode, nafCode, name, postalCode, county, region } = repEq.company;
  const siren = repEq.siren;

  // Créer l'objet CompanyDTO avec les valeurs par défaut pour les champs qui pourraient être undefined
  // Créer l'objet CompanyDTO avec les valeurs par défaut pour les champs qui pourraient être undefined ou vides
  const companyDTO: CompanyDTO = {
    countryIsoCode: countryCode,
    nafCode: nafCode,
    name,
    siren,
    county,
    region,
  };

  // Ajouter explicitement les propriétés avec des valeurs par défaut si elles sont vides ou undefined
  if (!address || address.trim() === "") {
    companyDTO.address = "Non renseigné";
  } else {
    companyDTO.address = address;
  }

  if (!city || city.trim() === "") {
    companyDTO.city = "Non renseigné";
  } else {
    companyDTO.city = city;
  }

  if (!postalCode || postalCode.trim() === "") {
    companyDTO.postalCode = "Non renseigné";
  } else {
    companyDTO.postalCode = postalCode;
  }

  return companyDTO;
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

      {/* Afficher l'objet company pour déboguer */}
      {console.log("Company object passed to RecapCardCompany:", buildCompanyFromRepeq(repEq))}
      <RecapCardCompany
        mode="admin"
        company={buildCompanyFromRepeq(repEq)}
        onSubmit={data => {
          console.log("Form submitted with data:", data);
          // Afficher une alerte pour indiquer que les modifications ont été enregistrées
          alert("Les modifications ont été enregistrées (simulation)");
        }}
      />

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
