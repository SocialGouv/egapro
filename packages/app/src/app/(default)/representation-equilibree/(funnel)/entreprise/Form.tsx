"use client";

import { type Organization } from "@api/core-domain/infra/auth/ProConnectProvider";
import { type CompanyDTO } from "@common/core-domain/dtos/CompanyDTO";
import { SkeletonFlex } from "@components/utils/skeleton/SkeletonFlex";
import { BackNextButtonsGroup, FormLayout, RecapCard, RecapCardCompany } from "@design-system";
import { Skeleton } from "@design-system/utils/client/skeleton";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { type Session } from "next-auth";

import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "../useRepeqFunnelStore";

export const EntrepriseForm = ({session} : {session: Session}) => {
  const [company, setCompany] = useState<Organization | null>(null);
  const funnel = useRepeqFunnelStore(state => state.funnel);
  const hydrated = useRepeqFunnelStoreHasHydrated();

  useEffect(() => {
    if (funnel?.siren && session.user.organization?.siren === funnel.siren) {
      setCompany(session.user.organization);
    } else {
      setCompany(null);
    }
  }, [funnel, session.user.organization]);

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
    address: "",
    city: "",
    countryIsoCode: "FR",
    nafCode: "01.11Z",
    name: company.label || "",
    postalCode: "",
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
