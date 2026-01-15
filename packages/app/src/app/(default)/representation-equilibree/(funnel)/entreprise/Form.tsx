"use client";

import { type Etablissement } from "@api/core-domain/infra/services/IEntrepriseService";
import { type CompanyDTO } from "@common/core-domain/dtos/CompanyDTO";
import { SkeletonFlex } from "@components/utils/skeleton/SkeletonFlex";
import { BackNextButtonsGroup, FormLayout, RecapCard, RecapCardCompany } from "@design-system";
import { Skeleton } from "@design-system/utils/client/skeleton";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { type Session } from "next-auth";

import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "../useRepeqFunnelStore";

export const EntrepriseForm = ({session} : {session: Session}) => {
  const [company, setCompany] = useState<Etablissement | null>(null);
  const funnel = useRepeqFunnelStore(state => state.funnel);
  const hydrated = useRepeqFunnelStoreHasHydrated();

  useEffect(() => {
    if (funnel?.siren && session.user.entreprise?.siren === funnel.siren) {
      setCompany(session.user.entreprise);
    } else {
      setCompany(null);
    }
  }, [funnel, session.user.entreprise]);

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

  const companyDto: CompanyDTO = {
    address: company.address,
    city: company.city,
    countryIsoCode: company.countryIsoCode as any,
    nafCode: company.activitePrincipaleUniteLegale as any,
    name: company.simpleLabel || "",
    postalCode: company.postalCode,
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
