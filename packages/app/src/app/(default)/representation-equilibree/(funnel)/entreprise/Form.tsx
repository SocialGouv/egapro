"use client";

import { type Entreprise } from "@api/core-domain/infra/services/IEntrepriseService";
import { type CompanyDTO } from "@common/core-domain/dtos/CompanyDTO";
import { getAdditionalMeta } from "@common/core-domain/helpers/entreprise";
import { COUNTRIES_COG_TO_ISO } from "@common/dict";
import { SkeletonFlex } from "@components/utils/skeleton/SkeletonFlex";
import { BackNextButtonsGroup, FormLayout, RecapCard, RecapCardCompany } from "@design-system";
import { Skeleton } from "@design-system/utils/client/skeleton";
import { getCompany } from "@globalActions/company";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "../useRepeqFunnelStore";

export const EntrepriseForm = () => {
  const [company, setCompany] = useState<Entreprise | null>(null);
  const funnel = useRepeqFunnelStore(state => state.funnel);
  const hydrated = useRepeqFunnelStoreHasHydrated();

  useEffect(() => {
    if (funnel?.siren && !company) {
      getCompany(funnel.siren).then(company => {
        if (company.ok) {
          setCompany(company.data);
        } else {
          throw new Error(`Could not fetch company with siren ${funnel.siren} (code ${company.error})`);
        }
      });
    }
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
    address: address?.includes("[ND]") ? "Information non diffusible" : address,
    city: company.firstMatchingEtablissement.libelleCommuneEtablissement?.includes("[ND]")
      ? ""
      : company.firstMatchingEtablissement.libelleCommuneEtablissement || "",
    countryIsoCode: COUNTRIES_COG_TO_ISO[countryCodeCOG],
    nafCode: company.activitePrincipaleUniteLegale,
    name: company.simpleLabel,
    postalCode: postalCode?.includes("[ND]") ? "" : postalCode,
    siren: company.siren,
  };

  return (
    <FormLayout>
      <RecapCardCompany mode="view" full company={companyDto} />

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
