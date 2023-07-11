"use client";

import { type CompanyProps } from "@common/core-domain/domain/declaration/Company";
import { CountryCode } from "@common/core-domain/domain/valueObjects/CountryCode";
import { FrenchPostalCode } from "@common/core-domain/domain/valueObjects/FrenchPostalCode";
import { NafCode } from "@common/core-domain/domain/valueObjects/NafCode";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { RecapCardCompany } from "packages/app/src/design-system/base/RecapCardCompany";

export const InformationEntreprise = () => {
  const commencer = useDeclarationFormManager(state => state.formData.commencer);

  const { entrepriseDéclarante } = commencer ?? {};

  const nafCode = entrepriseDéclarante?.codeNaf;
  const siren = entrepriseDéclarante?.siren;

  if (!nafCode || !siren) return null;

  const company: CompanyProps = {
    address: entrepriseDéclarante?.adresse,
    city: entrepriseDéclarante?.commune,
    countryCode: entrepriseDéclarante?.codePays ? new CountryCode(entrepriseDéclarante?.codePays) : undefined,
    nafCode: new NafCode(nafCode),
    name: entrepriseDéclarante?.raisonSociale ?? "",
    postalCode: entrepriseDéclarante?.codePostal ? new FrenchPostalCode(entrepriseDéclarante?.codePostal) : undefined,
    siren: new Siren(siren),
  };

  return (
    <ClientOnly fallback={<SkeletonForm fields={1} />}>
      <RecapCardCompany company={company} />
    </ClientOnly>
  );
};
