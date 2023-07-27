import { type CompanyDTO } from "@common/core-domain/dtos/CompanyDTO";
import { COUNTRIES_ISO_TO_LIB, NAF } from "@common/dict";

import { RecapCard } from "./RecapCard";

type Props = { company: CompanyDTO };

export const RecapCardCompany = ({ company }: Props) => {
  const { name, address, postalCode, city, countryIsoCode, siren, nafCode } = company;

  return (
    <RecapCard
      title="Informations entreprise déclarante"
      content={
        <>
          <strong>{name}</strong>
          <br />
          {address}
          <br />
          {postalCode} {city}
          {countryIsoCode && countryIsoCode !== "FR" && `, ${COUNTRIES_ISO_TO_LIB[countryIsoCode]}`}
          <br />
          Siren : <strong>{siren}</strong>
          <br />
          NAF : <strong>{nafCode}</strong> - {nafCode && NAF[nafCode].description}
        </>
      }
    />
  );
};
