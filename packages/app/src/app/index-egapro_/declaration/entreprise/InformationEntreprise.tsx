"use client";

import {
  RecapSection,
  RecapSectionItem,
  RecapSectionItemContent,
  RecapSectionItemLegend,
  RecapSectionItems,
  RecapSectionTitle,
} from "@components/next13/RecapSection";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { fetcher, useConfig } from "@services/apiClient";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type Entreprise } from "@services/form/declaration/entreprise";

/**
 * Build address on 2 lines.
 */
const formatAdresse = (entreprise?: Entreprise) => {
  if (!entreprise) return "";

  const { adresse, codePostal, commune } = entreprise;
  return [`${adresse}`, `${codePostal ?? ""} ${commune ?? ""}`];
};

export const InformationEntreprise = () => {
  const commencer = useDeclarationFormManager(state => state.formData.commencer);

  const {
    config: { nafLabelFromCode },
  } = useConfig(fetcher);

  const address = formatAdresse(commencer?.entrepriseDéclarante);

  return (
    <RecapSection>
      <RecapSectionTitle>Informations de l’entreprise déclarante</RecapSectionTitle>
      <ClientOnly fallback={<SkeletonForm fields={5} />}>
        <RecapSectionItems>
          <RecapSectionItem>
            <RecapSectionItemLegend>Raison sociale</RecapSectionItemLegend>
            <RecapSectionItemContent>{commencer?.entrepriseDéclarante?.raisonSociale}</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Numéro Siren</RecapSectionItemLegend>
            <RecapSectionItemContent>{commencer?.entrepriseDéclarante?.siren}</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Code NAF</RecapSectionItemLegend>
            <RecapSectionItemContent>
              {nafLabelFromCode(commencer?.entrepriseDéclarante?.codeNaf)}
            </RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Adresse</RecapSectionItemLegend>
            <RecapSectionItemContent>
              {address[0]} <br />
              {address[1]}
            </RecapSectionItemContent>
          </RecapSectionItem>
        </RecapSectionItems>
      </ClientOnly>
    </RecapSection>
  );
};
