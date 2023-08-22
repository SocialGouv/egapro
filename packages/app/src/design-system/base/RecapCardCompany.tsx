import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { type CompanyDTO } from "@common/core-domain/dtos/CompanyDTO";
import { COUNTRIES_ISO_TO_LIB, NAF } from "@common/dict";
import { ClientBodyPortal } from "@components/utils/ClientBodyPortal";

import { Grid, GridCol } from "./Grid";
import { RecapCard } from "./RecapCard";
import { Text } from "./Typography";

type Props = { company: CompanyDTO; full?: boolean };

// TODO: replace with tooltip when available in DSFR
const infoModale = createModal({
  id: "entreprise-info",
  isOpenedByDefault: false,
});

export const RecapCardCompany = ({ company, full }: Props) => {
  const { name, address, postalCode, city, countryIsoCode, siren, nafCode } = company;

  return (
    <>
      <ClientBodyPortal>
        <infoModale.Component title="Informations de l'entreprise déclarante">
          Ces informations sont renseignées automatiquement et ne sont pas modifiables (source : Répertoire Sirene de
          l'INSEE).
        </infoModale.Component>
      </ClientBodyPortal>
      <RecapCard
        title={
          full ? (
            <Text text="Informations de l'entreprise déclarante" variant={["xl"]} inline />
          ) : (
            "Informations entreprise déclarante"
          )
        }
        sideButtonProps={{
          iconId: "ri-information-fill",
          title: "Informations de l'entreprise déclarante",
          priority: "tertiary no outline",
          style: { alignSelf: "center" },
          size: "small",
          nativeButtonProps: infoModale.buttonProps,
        }}
        content={
          full ? (
            <>
              <Grid haveGutters>
                <GridCol sm={12} className="fr-pb-0">
                  <strong>Raison sociale</strong>
                  <br />
                  {name}
                </GridCol>
                <GridCol sm={3} className="fr-pb-0">
                  <strong>Numéro de Siren</strong>
                  <br />
                  {siren}
                </GridCol>
                {nafCode && (
                  <GridCol sm={9} className="fr-pb-0">
                    <strong>Code NAF</strong>
                    <br />
                    {nafCode} - {NAF[nafCode].description}
                  </GridCol>
                )}
                <GridCol sm={12}>
                  <strong>Adresse</strong>
                  <br />
                  {address}, {postalCode} {city}
                  {countryIsoCode && countryIsoCode !== "FR" && `, ${COUNTRIES_ISO_TO_LIB[countryIsoCode]}`}
                </GridCol>
              </Grid>
            </>
          ) : (
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
          )
        }
      />
    </>
  );
};
