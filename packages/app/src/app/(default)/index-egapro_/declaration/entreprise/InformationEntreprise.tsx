"use client";

import { type CompanyDTO } from "@common/core-domain/dtos/CompanyDTO";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { RecapCardCompany } from "packages/app/src/design-system/base/RecapCardCompany";

export const InformationEntreprise = () => {
  const commencer = useDeclarationFormManager(state => state.formData.commencer);

  const { entrepriseDéclarante } = commencer ?? {};

  if (!entrepriseDéclarante) return null;

  const siren = entrepriseDéclarante.siren;

  const company: CompanyDTO = {
    address: entrepriseDéclarante?.adresse,
    city: entrepriseDéclarante?.commune || "",
    countryIsoCode: entrepriseDéclarante?.codePays,
    nafCode: entrepriseDéclarante.codeNaf,
    name: entrepriseDéclarante.raisonSociale,
    postalCode: entrepriseDéclarante?.codePostal || "",
    siren: siren,
  };

  return (
    <ClientOnly fallback={<SkeletonForm fields={1} />}>
      <RecapCardCompany company={company} />
    </ClientOnly>
  );
};
