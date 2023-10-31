import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { type CompanyDTO } from "@common/core-domain/dtos/CompanyDTO";
import { COUNTRIES_ISO_TO_LIB, NAF } from "@common/dict";
import { ClientBodyPortal } from "@components/utils/ClientBodyPortal";

import { funnelStaticConfig } from "../../app/(default)/index-egapro/declaration/declarationFunnelConfiguration";
import { Grid, GridCol } from "./Grid";
import { RecapCard } from "./RecapCard";
import { Text } from "./Typography";

type Props = { company: CompanyDTO; edit?: boolean; full?: boolean; title?: string };

// TODO: replace with tooltip when available in DSFR
const infoModale = createModal({
  id: "entreprise-info",
  isOpenedByDefault: false,
});

export const RecapCardCompany = ({ company, full, title, edit }: Props) => {
  const { name, address, postalCode, city, countryIsoCode, siren, nafCode, workforce, ues } = company;

  const titleFull = title ?? "Informations de l'entreprise déclarante";

  const postalCodeCity = `${postalCode} ${city}`.trim();
  const countryLib =
    countryIsoCode && countryIsoCode !== "FR" && `${postalCodeCity && ", "}${COUNTRIES_ISO_TO_LIB[countryIsoCode]}`;

  return (
    <>
      <ClientBodyPortal>
        <infoModale.Component title="">
          Ces informations sont renseignées automatiquement et ne sont pas modifiables (source : Répertoire Sirene de
          l'INSEE).
        </infoModale.Component>
      </ClientBodyPortal>
      <RecapCard
        title={full ? <Text text={titleFull} variant={["xl"]} inline /> : title ?? "Informations entreprise déclarante"}
        editLink={(edit || void 0) && funnelStaticConfig["entreprise"].url}
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
                  <strong>Siren</strong>
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
                  {address}
                  {postalCodeCity ? `, ${postalCodeCity}` : " "}
                  {countryLib}
                </GridCol>
              </Grid>
            </>
          ) : (
            <>
              Entreprise déclarante : <strong>{name}</strong>
              <br />
              {address}
              {(postalCodeCity || countryLib) && <br />}
              {postalCodeCity}
              {countryLib}
              <br />
              Siren : <strong>{siren}</strong>
              <br />
              Code NAF : <strong>{nafCode}</strong> - {nafCode && NAF[nafCode].description}
              {workforce?.range && (
                <>
                  <br />
                  Tranche d'effectifs assujettis de l'
                  {ues?.name ? "UES" : "entreprise"} : <strong>{CompanyWorkforceRange.Label[workforce.range]}</strong>
                </>
              )}
            </>
          )
        }
      />
    </>
  );
};
