"use client";

import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { RecapCardCompany } from "packages/app/src/design-system/base/client/RecapCardCompany";

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

  return <RecapCardCompany company={company} />;
};
