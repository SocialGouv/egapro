"use client";

import { COUNTRIES_ISO_TO_LIB, NAF } from "@common/dict";
import { type CodeNaf } from "@common/models/generated";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";

import { RecapCard } from "../RecapCard";

type Props = {
  company: {
    address?: string;
    city?: string;
    countryCode?: string;
    nafCode?: CodeNaf;
    name?: string;
    postalCode?: string;
    siren?: string;
  };
};

export const RecapCardCompany = ({ company }: Props) => {
  const { name, address, postalCode, city, countryCode, siren, nafCode } = company;

  return (
    <RecapCard
      title="Informations entreprise"
      content={
        <ClientOnly fallback={<SkeletonForm fields={1} />}>
          <strong>{name}</strong>
          <br />
          {address}, {postalCode} {city}
          {countryCode && countryCode !== "FR" && `, ${COUNTRIES_ISO_TO_LIB[countryCode]}`}
          <br />
          Siren : {siren} - Code NAF : {nafCode} - {nafCode && NAF[nafCode].description}
        </ClientOnly>
      }
    />
  );
};
