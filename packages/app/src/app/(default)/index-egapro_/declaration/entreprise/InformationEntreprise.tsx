"use client";

import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { RecapCardCompany } from "packages/app/src/design-system/base/RecapCardCompany";

export const InformationEntreprise = () => {
  const commencer = useDeclarationFormManager(state => state.formData.commencer);

  const company = {
    address: commencer?.entrepriseDéclarante?.adresse,
    city: commencer?.entrepriseDéclarante?.commune,
    countryCode: commencer?.entrepriseDéclarante?.codePays,
    nafCode: commencer?.entrepriseDéclarante?.codeNaf,
    name: commencer?.entrepriseDéclarante?.raisonSociale,
    postalCode: commencer?.entrepriseDéclarante?.codePostal,
    siren: commencer?.entrepriseDéclarante?.siren,
  };

  return (
    <ClientOnly fallback={<SkeletonForm fields={1} />}>
      <RecapCardCompany company={company} />
    </ClientOnly>
  );
};
