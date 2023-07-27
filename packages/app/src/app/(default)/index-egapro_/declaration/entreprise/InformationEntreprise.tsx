"use client";

import { type CompanyDTO } from "@common/core-domain/dtos/CompanyDTO";
import { ClientOnly } from "@components/utils/ClientOnly";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { RecapCardCompany } from "packages/app/src/design-system/base/RecapCardCompany";

export const InformationEntreprise = () => {
  const commencer = useDeclarationFormManager(state => state.formData.commencer);

  const { entrepriseDéclarante } = commencer ?? {};

  if (!entrepriseDéclarante) return null;

  const company: CompanyDTO = {
    address: entrepriseDéclarante?.adresse,
    city: entrepriseDéclarante?.commune || "",
    countryIsoCode: entrepriseDéclarante?.codePays,
    nafCode: entrepriseDéclarante.codeNaf,
    name: entrepriseDéclarante.raisonSociale,
    postalCode: entrepriseDéclarante?.codePostal || "",
    siren: entrepriseDéclarante.siren,
  };

  return (
    <ClientOnly>
      <RecapCardCompany company={company} />
    </ClientOnly>
  );
};
