import { type CompanyProps } from "@common/core-domain/domain/declaration/Company";
import { COUNTRIES_ISO_TO_LIB, NAF } from "@common/dict";

import { RecapCard } from "./RecapCard";

type Props = { company: CompanyProps };

export const RecapCardCompany = ({ company }: Props) => {
  const { name, address, postalCode, city, countryCode, siren, nafCode } = company;

  return (
    <RecapCard
      title="Informations entreprise déclarante"
      content={
        <>
          <strong>{name}</strong>
          <br />
          {address}
          <br />
          {postalCode?.getValue()} {city}
          {countryCode && countryCode.getValue() !== "FR" && `, ${COUNTRIES_ISO_TO_LIB[countryCode.getValue()]}`}
          <br />
          Siren : <strong>{siren.getValue()}</strong>
          <br />
          Code NAF : <strong>{nafCode.getValue()}</strong> - {nafCode && NAF[nafCode.getValue()].description}
        </>
      }
    />
  );
};
