"use client";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { NotComputableReasonExecutiveRepEq } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonExecutiveRepEq";
import { NotComputableReasonMemberRepEq } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonMemberRepEq";
import { type CompanyDTO } from "@common/core-domain/dtos/CompanyDTO";
import { type RepresentationEquilibreeDTO } from "@common/core-domain/dtos/RepresentationEquilibreeDTO";
import { formatIsoToFr } from "@common/utils/date";
import { RecapCard, RecapCardCompany } from "@design-system";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateCompanyInfos } from "./actions";

export interface DetailRepEqProps {
  edit?: boolean;
  publicMode?: boolean;
  repEq: RepresentationEquilibreeDTO;
}

// TODO: update RepresentationEquilibreeDTO to use CompanyProps instead.
const buildCompanyFromRepeq = (repEq: RepresentationEquilibreeDTO): CompanyDTO => {
  const { address, city, countryCode, nafCode, name, postalCode, county, region } = repEq.company;
  const siren = repEq.siren;

  const companyDTO: CompanyDTO = {
    countryIsoCode: countryCode,
    nafCode: nafCode,
    name,
    siren,
    county,
    region,
  };

  if (!address || address.trim() === "") {
    companyDTO.address = "";
  } else {
    companyDTO.address = address;
  }

  if (!city || city.trim() === "") {
    companyDTO.city = "";
  } else {
    companyDTO.city = city;
  }

  if (!postalCode || postalCode.trim() === "") {
    companyDTO.postalCode = "";
  } else {
    companyDTO.postalCode = postalCode;
  }

  return companyDTO;
};

export const DetailRepEq = ({ repEq, edit, publicMode }: DetailRepEqProps) => {
  const router = useRouter();
  const [_, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ message: string; success: boolean } | null>(null);

  // Fonction pour mettre à jour les informations de l'entreprise
  const handleUpdateCompany = async (updatedCompanyData: CompanyDTO) => {
    try {
      setIsSaving(true);
      setSaveStatus(null);

      const result = await updateCompanyInfos(updatedCompanyData.siren, repEq.year, updatedCompanyData, undefined);

      if (!result.ok) {
        throw new Error(result.error);
      }

      // Afficher un message de succès
      setSaveStatus({
        success: true,
        message: "Les modifications ont été enregistrées avec succès.",
      });

      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la mise à jour des informations de l'entreprise:", error);

      // Afficher un message d'erreur
      setSaveStatus({
        success: false,
        message:
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "Une erreur est survenue lors de l'enregistrement des modifications.",
      });
    } finally {
      setIsSaving(false);
    }
  };

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

      <RecapCardCompany mode="admin" company={buildCompanyFromRepeq(repEq)} onSubmit={handleUpdateCompany} />
      {saveStatus && (
        <Alert
          severity={saveStatus.success ? "success" : "error"}
          className={fr.cx("fr-mb-2w")}
          description={saveStatus.message}
          small
        />
      )}

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
