import type { RepresentationEquilibreeAPI } from "@common/models/representation-equilibree";
import {
  motifNonCalculabiliteCadresOptions,
  motifNonCalculabiliteMembresOptions,
} from "@common/models/representation-equilibree";
import { formatIsoToFr } from "@common/utils/date";
import { formatAdresse, useConfig } from "@services/apiClient";

import {
  RecapSection,
  RecapSectionItem,
  RecapSectionItemContent,
  RecapSectionItemLegend,
  RecapSectionItems,
  RecapSectionTitle,
} from "../design-system/base/RecapSection";

/**
 * Stateless component to display Représentation équilibrée's informations.
 */
export const DetailRepresentationEquilibree = ({ data }: { data: RepresentationEquilibreeAPI["data"] }) => {
  const { déclarant, entreprise, indicateurs, déclaration } = data;
  const { config } = useConfig();

  const { nafLabelFromCode } = config;

  const formatMotif = (motif: string): string | undefined => {
    const found =
      motifNonCalculabiliteCadresOptions.find(e => e.value === motif) ||
      motifNonCalculabiliteMembresOptions.find(e => e.value === motif);

    return found?.label;
  };

  return (
    <>
      <p>
        Déclaration des écarts de représentation Femmes/Hommes pour l’année {déclaration.année_indicateurs + 1} au titre
        des données {déclaration.année_indicateurs}.
      </p>
      {déclaration?.date && (
        <RecapSection>
          <RecapSectionTitle>Date de déclaration</RecapSectionTitle>
          <RecapSectionItems>
            <RecapSectionItem>
              <RecapSectionItemContent>{déclaration?.date && formatIsoToFr(déclaration?.date)}</RecapSectionItemContent>
            </RecapSectionItem>
          </RecapSectionItems>
        </RecapSection>
      )}
      <RecapSection>
        <RecapSectionTitle>Informations déclarant</RecapSectionTitle>
        <RecapSectionItems>
          <RecapSectionItem>
            <RecapSectionItemLegend>Nom Prénom</RecapSectionItemLegend>
            <RecapSectionItemContent>
              {déclarant?.nom}&nbsp;{déclarant?.prénom}
            </RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Adresse email</RecapSectionItemLegend>
            <RecapSectionItemContent>{déclarant?.email}</RecapSectionItemContent>
          </RecapSectionItem>
        </RecapSectionItems>
      </RecapSection>
      <RecapSection>
        <RecapSectionTitle>Informations entreprise</RecapSectionTitle>
        <RecapSectionItems>
          <RecapSectionItem>
            <RecapSectionItemLegend>Raison sociale</RecapSectionItemLegend>
            <RecapSectionItemContent>{entreprise?.raison_sociale}</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Siren</RecapSectionItemLegend>
            <RecapSectionItemContent>{entreprise?.siren}</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Code NAF</RecapSectionItemLegend>
            <RecapSectionItemContent>{nafLabelFromCode(entreprise?.code_naf)}</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Adresse</RecapSectionItemLegend>
            <RecapSectionItemContent>
              {entreprise && formatAdresse(entreprise).map(element => <div key={element}>{element}</div>)}
            </RecapSectionItemContent>
          </RecapSectionItem>
        </RecapSectionItems>
      </RecapSection>
      <RecapSection>
        <RecapSectionTitle>Période de référence</RecapSectionTitle>
        <RecapSectionItems>
          <RecapSectionItem>
            <RecapSectionItemLegend>Année au titre de laquelle les écarts sont calculés</RecapSectionItemLegend>
            <RecapSectionItemContent>{déclaration.année_indicateurs}</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>
              Date de fin de la période de douze mois consécutifs correspondant à l’exercice comptable pour le calcul
              des écarts
            </RecapSectionItemLegend>
            <RecapSectionItemContent>
              {déclaration?.fin_période_référence && formatIsoToFr(déclaration.fin_période_référence)}
            </RecapSectionItemContent>
          </RecapSectionItem>
        </RecapSectionItems>
      </RecapSection>
      <RecapSection>
        <RecapSectionTitle>Écart de représentation parmi les cadres dirigeants</RecapSectionTitle>
        {indicateurs?.représentation_équilibrée.motif_non_calculabilité_cadres ? (
          <RecapSectionItems>
            <RecapSectionItem>
              <RecapSectionItemLegend>Motif de non calculabilité</RecapSectionItemLegend>{" "}
              <RecapSectionItemContent>
                {" "}
                {formatMotif(indicateurs.représentation_équilibrée.motif_non_calculabilité_cadres)}{" "}
              </RecapSectionItemContent>{" "}
            </RecapSectionItem>
          </RecapSectionItems>
        ) : (
          <RecapSectionItems>
            <RecapSectionItem>
              <RecapSectionItemLegend>Pourcentage de femmes parmi les cadres dirigeants</RecapSectionItemLegend>
              <RecapSectionItemContent>
                {indicateurs?.représentation_équilibrée.pourcentage_femmes_cadres}&nbsp;%
              </RecapSectionItemContent>
            </RecapSectionItem>
            <RecapSectionItem>
              <RecapSectionItemLegend>Pourcentage d’hommes parmi les cadres dirigeants</RecapSectionItemLegend>
              <RecapSectionItemContent>
                {indicateurs?.représentation_équilibrée.pourcentage_hommes_cadres}&nbsp;%
              </RecapSectionItemContent>
            </RecapSectionItem>
          </RecapSectionItems>
        )}
      </RecapSection>
      <RecapSection>
        <RecapSectionTitle>Écart de représentation parmi les membres des instances dirigeantes</RecapSectionTitle>
        {indicateurs?.représentation_équilibrée.motif_non_calculabilité_membres ? (
          <RecapSectionItems>
            <RecapSectionItem>
              <RecapSectionItemLegend>Motif de non calculabilité</RecapSectionItemLegend>
              <RecapSectionItemContent>
                {formatMotif(indicateurs?.représentation_équilibrée.motif_non_calculabilité_membres)}
              </RecapSectionItemContent>
            </RecapSectionItem>
          </RecapSectionItems>
        ) : (
          <RecapSectionItems>
            <RecapSectionItem>
              <RecapSectionItemLegend>
                Pourcentage de femmes parmi les membres des instances dirigeantes
              </RecapSectionItemLegend>
              <RecapSectionItemContent>
                {indicateurs?.représentation_équilibrée.pourcentage_femmes_membres}&nbsp;%
              </RecapSectionItemContent>
            </RecapSectionItem>
            <RecapSectionItem>
              <RecapSectionItemLegend>
                Pourcentage d’hommes parmi les membres des instances dirigeantes
              </RecapSectionItemLegend>
              <RecapSectionItemContent>
                {indicateurs?.représentation_équilibrée.pourcentage_hommes_membres}&nbsp;%
              </RecapSectionItemContent>
            </RecapSectionItem>
          </RecapSectionItems>
        )}
      </RecapSection>
      <RecapSection>
        <RecapSectionTitle>Publication</RecapSectionTitle>
        <RecapSectionItems>
          <RecapSectionItem>
            <RecapSectionItemLegend>Date de publication</RecapSectionItemLegend>
            <RecapSectionItemContent>
              {déclaration?.publication && formatIsoToFr(déclaration.publication.date)}
            </RecapSectionItemContent>
          </RecapSectionItem>
          {déclaration?.publication?.url ? (
            <RecapSectionItem>
              <RecapSectionItemLegend>Site internet de publication</RecapSectionItemLegend>
              <RecapSectionItemContent>{déclaration?.publication?.url}</RecapSectionItemContent>
            </RecapSectionItem>
          ) : (
            <RecapSectionItem>
              <RecapSectionItemLegend>Modalités de communication auprès des salariés</RecapSectionItemLegend>
              <RecapSectionItemContent>{déclaration?.publication?.modalités}</RecapSectionItemContent>
            </RecapSectionItem>
          )}
        </RecapSectionItems>
      </RecapSection>
    </>
  );
};
