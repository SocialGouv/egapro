import { type CompanyProps } from "@common/core-domain/domain/declaration/Company";
import { COUNTRIES_ISO_TO_LIB, NAF } from "@common/dict";

import { RecapCard } from "./RecapCard";

type Props = { company: CompanyProps };

export const RecapCardCompany = ({ company }: Props) => {
  const { name, address, postalCode, city, countryCode, siren, nafCode } = company;

  return (
    <RecapCard
      title="Informations entreprise"
      content={
        <>
          <strong>{name}</strong>
          <br />
          {address}, {postalCode?.getValue()} {city}
          {countryCode && countryCode.getValue() !== "FR" && `, ${COUNTRIES_ISO_TO_LIB[countryCode.getValue()]}`}
          <br />
          Siren : {siren.getValue()} - Code NAF : {nafCode.getValue()} -{" "}
          {nafCode && NAF[nafCode.getValue()].description}
        </>
      }
    />
  );
};
