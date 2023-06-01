"use client";

import { ClientOnly } from "@components/ClientOnly";
import {
  RecapSection,
  RecapSectionItem,
  RecapSectionItemContent,
  RecapSectionItemLegend,
  RecapSectionItems,
  RecapSectionTitle,
} from "@components/next13/RecapSection";
import { fetcher, useConfig } from "@services/apiClient";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";

/**
 * Build address on 2 lines.
 */
const formatAdresse = (entreprise: DeclarationFormState["_entrepriseDéclarante"]) => {
  if (!entreprise) return "";

  const { adresse, codePostal, commune } = entreprise;
  return [`${adresse}`, `${codePostal ?? ""} ${commune ?? ""}`];
};

export const InformationEntreprise = () => {
  const { formData } = useDeclarationFormManager();

  const {
    config: { nafLabelFromCode },
  } = useConfig(fetcher);

  const address = formatAdresse(formData._entrepriseDéclarante);

  return (
    <RecapSection>
      <RecapSectionTitle>Informations de l’entreprise déclarante</RecapSectionTitle>
      <ClientOnly>
        <RecapSectionItems>
          <RecapSectionItem>
            <RecapSectionItemLegend>Raison sociale</RecapSectionItemLegend>
            <RecapSectionItemContent>{formData._entrepriseDéclarante?.raisonSociale}</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Numéro Siren</RecapSectionItemLegend>
            <RecapSectionItemContent>{formData._entrepriseDéclarante?.siren}</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Code NAF</RecapSectionItemLegend>
            <RecapSectionItemContent>
              {nafLabelFromCode(formData._entrepriseDéclarante?.codeNaf)}
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
