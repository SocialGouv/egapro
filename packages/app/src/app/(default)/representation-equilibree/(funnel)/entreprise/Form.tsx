"use client";

import { type Entreprise } from "@api/core-domain/infra/services/IEntrepriseService";
import { type CompanyDTO } from "@common/core-domain/dtos/CompanyDTO";
import { getAdditionalMeta } from "@common/core-domain/helpers/entreprise";
import { COUNTRIES_COG_TO_ISO } from "@common/dict";
import { SkeletonFlex } from "@components/utils/skeleton/SkeletonFlex";
import { BackNextButtonsGroup, FormLayout, RecapCard, RecapCardCompany } from "@design-system";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";

import { getCompany } from "../../actions";
import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "../useRepeqFunnelStore";

export const EntrepriseForm = () => {
  const [company, setCompany] = useState<Entreprise | null>(null);
  const funnel = useRepeqFunnelStore(state => state.funnel);
  const hydrated = useRepeqFunnelStoreHasHydrated();

  useEffect(() => {
    if (funnel?.siren && !company) getCompany(funnel.siren).then(setCompany);
  }, [funnel, company]);

  if (!hydrated || !company) {
    return (
      <FormLayout>
        <RecapCard title={<SkeletonFlex />} content={<Skeleton count={6} />} />
      </FormLayout>
    );
  }

  if (hydrated && !funnel?.siren) {
    return redirect("/representation-equilibree/commencer");
  }

  const { address, countryCodeCOG, postalCode } = getAdditionalMeta(company);

  const companyDto: CompanyDTO = {
    address,
    city: company.firstMatchingEtablissement.libelleCommuneEtablissement,
    countryIsoCode: COUNTRIES_COG_TO_ISO[countryCodeCOG],
    nafCode: company.activitePrincipaleUniteLegale,
    name: company.simpleLabel,
    postalCode,
    siren: company.siren,
  };

  return (
    <FormLayout>
      <RecapCardCompany full company={companyDto} />

      <BackNextButtonsGroup
        backProps={{
          linkProps: {
            href: "/representation-equilibree/declarant",
          },
        }}
        nextProps={{
          linkProps: {
            href: "/representation-equilibree/periode-reference",
          },
        }}
        nextType="button"
      />
    </FormLayout>
  );
};
