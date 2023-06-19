"use client";

import { type Entreprise } from "@api/core-domain/infra/services/IEntrepriseService";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
<<<<<<< HEAD
import { getAdditionalMeta } from "@common/core-domain/helpers/entreprise";
import { COUNTIES, COUNTRIES_COG_TO_LIB, REGIONS } from "@common/dict";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { FormLayout } from "@design-system";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCompany } from "../../actions";
import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "../useRepeqFunnelStore";
=======
import { COUNTIES, COUNTRIES_COG_TO_ISO, COUNTY_TO_REGION, inseeCodeToCounty, REGIONS } from "@common/dict";
import { FormLayout } from "@design-system";
import { times } from "lodash";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";

import { getCompany } from "../actions";
import { useRepeqFunnelStore } from "../useRepeqFunnelStore";
>>>>>>> 526270801b46296844cd14907305b0eeee086d21

export const EntrepriseForm = () => {
  const router = useRouter();
  const [company, setCompany] = useState<Entreprise | null>(null);
  const funnel = useRepeqFunnelStore(state => state.funnel);
<<<<<<< HEAD
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
=======

  useEffect(() => {
    (async () => funnel?.siren && setCompany(await getCompany(funnel.siren)))();
  }, [funnel?.siren]);

  if (!company?.firstMatchingEtablissement) {
    return (
      <FormLayout>
        {times(9).map(idx => (
          <div key={idx}>
            <Skeleton width="70%" />
            <Skeleton height="2.5rem" />
          </div>
        ))}
      </FormLayout>
    );
  }

  const county = inseeCodeToCounty(company.firstMatchingEtablissement.codeCommuneEtablissement);
  const postalCode = company.firstMatchingEtablissement.codePostalEtablissement;
  const address = company.firstMatchingEtablissement.address.split(postalCode)[0].trim();
  const countryCode = company.firstMatchingEtablissement.codePaysEtrangerEtablissement ?? "XXXXX";
>>>>>>> 526270801b46296844cd14907305b0eeee086d21

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
<<<<<<< HEAD
          value: regionCode ? REGIONS[regionCode] : "",
=======
          value: county ? REGIONS[COUNTY_TO_REGION[county]] : "",
>>>>>>> 526270801b46296844cd14907305b0eeee086d21
        }}
      />
      <Input
        label="Département"
        nativeInputProps={{
          readOnly: true,
<<<<<<< HEAD
          value: countyCode ? COUNTIES[countyCode] : "",
=======
          value: county ? COUNTIES[county] : "",
>>>>>>> 526270801b46296844cd14907305b0eeee086d21
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
<<<<<<< HEAD
          value: COUNTRIES_COG_TO_LIB[countryCodeCOG],
=======
          value: COUNTRIES_COG_TO_ISO[countryCode],
>>>>>>> 526270801b46296844cd14907305b0eeee086d21
        }}
      />
      <ButtonsGroup
        inlineLayoutWhen="sm and up"
        buttons={[
          {
            children: "Précédent",
            linkProps: {
              href: "/representation-equilibree/declarant",
            },
            priority: "secondary",
          },
          {
            children: "Suivant",
            nativeButtonProps: {
              onClick() {
                router.push("/representation-equilibree/periode-reference");
              },
            },
          },
        ]}
      />
    </FormLayout>
  );
};
