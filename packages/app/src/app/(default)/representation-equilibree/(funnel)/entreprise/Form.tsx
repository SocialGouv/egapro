"use client";

import { type Entreprise } from "@api/core-domain/infra/services/IEntrepriseService";
import Input from "@codegouvfr/react-dsfr/Input";
import { getAdditionalMeta } from "@common/core-domain/helpers/entreprise";
import { COUNTIES, COUNTRIES_COG_TO_LIB, REGIONS } from "@common/dict";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup, FormLayout } from "@design-system";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCompany } from "../../actions";
import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "../useRepeqFunnelStore";

export const EntrepriseForm = () => {
  const router = useRouter();
  const [company, setCompany] = useState<Entreprise | null>(null);
  const funnel = useRepeqFunnelStore(state => state.funnel);
  const hydrated = useRepeqFunnelStoreHasHydrated();

  useEffect(() => {
    if (funnel?.siren && !company) getCompany(funnel.siren).then(setCompany);
  }, [funnel, company]);

  if (!hydrated || !company) {
    return <SkeletonForm fields={9} />;
  }

  if (!funnel?.siren) {
    return redirect("/representation-equilibree/commencer");
  }

  const { address, countryCodeCOG, countyCode, postalCode, regionCode } = getAdditionalMeta(company);

  return (
    <FormLayout>
      <Input
        label="Siren"
        nativeInputProps={{
          readOnly: true,
          value: funnel?.siren,
        }}
      />
      <Input
        label="Raison sociale de l'entreprise"
        nativeInputProps={{
          readOnly: true,
          value: company.simpleLabel,
        }}
      />
      <Input
        label="Code NAF"
        nativeInputProps={{
          readOnly: true,
          value: `${company.activitePrincipaleUniteLegale} - ${company.activitePrincipale}`,
        }}
      />
      <Input
        label="Région"
        nativeInputProps={{
          readOnly: true,
          value: regionCode ? REGIONS[regionCode] : "",
        }}
      />
      <Input
        label="Département"
        nativeInputProps={{
          readOnly: true,
          value: countyCode ? COUNTIES[countyCode] : "",
        }}
      />
      <Input
        label="Adresse"
        nativeInputProps={{
          readOnly: true,
          value: address,
        }}
      />
      <Input
        label="Code postal"
        nativeInputProps={{
          readOnly: true,
          value: postalCode,
        }}
      />
      <Input
        label="Commune"
        nativeInputProps={{
          readOnly: true,
          value: company.firstMatchingEtablissement.libelleCommuneEtablissement,
        }}
      />
      <Input
        label="Code pays"
        nativeInputProps={{
          readOnly: true,
          value: COUNTRIES_COG_TO_LIB[countryCodeCOG],
        }}
      />
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
