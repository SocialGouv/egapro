"use client";

import { type CompanyDTO } from "@common/core-domain/dtos/CompanyDTO";
import { type Entreprise } from "@common/core-domain/dtos/DeclarationDTO";
import { ClientOnly } from "@components/utils/ClientOnly";
import { FormLayout, RecapCardCompany } from "@design-system";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";

export const InformationEntreprise = () => {
  const { formData } = useDeclarationFormManager();

  const entrepriseDéclarante = formData.entreprise?.entrepriseDéclarante;

  if (!entrepriseDéclarante) return null;

  const cleanAddress = (entrepriseDéclarante: Entreprise) => {
    let address = entrepriseDéclarante.adresse;
    if (entrepriseDéclarante.commune) address = address.replace(entrepriseDéclarante.commune, "");
    if (entrepriseDéclarante.codePostal) address = address.replace(entrepriseDéclarante.codePostal, "");
    return address;
  };

  const company: CompanyDTO = {
    address: cleanAddress(entrepriseDéclarante),
    city: entrepriseDéclarante?.commune || "",
    countryIsoCode: entrepriseDéclarante?.codePays,
    nafCode: entrepriseDéclarante.codeNaf,
    name: entrepriseDéclarante.raisonSociale,
    postalCode: entrepriseDéclarante?.codePostal || "",
    siren: entrepriseDéclarante.siren,
  };

  return (
    <ClientOnly>
      <FormLayout>
        <RecapCardCompany mode="view" full company={company} />
      </FormLayout>
    </ClientOnly>
  );
};
