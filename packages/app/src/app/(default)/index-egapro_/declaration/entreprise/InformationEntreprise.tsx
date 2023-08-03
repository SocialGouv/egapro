"use client";

import { type CompanyDTO } from "@common/core-domain/dtos/CompanyDTO";
import { ClientOnly } from "@components/utils/ClientOnly";
import { RecapCardCompany } from "@design-system";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";

export const InformationEntreprise = () => {
  const { formData } = useDeclarationFormManager();

  const entrepriseDéclarante = formData.entreprise?.entrepriseDéclarante;

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
