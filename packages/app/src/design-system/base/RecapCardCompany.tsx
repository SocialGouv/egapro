import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { type CompanyDTO } from "@common/core-domain/dtos/CompanyDTO";
import { COUNTRIES_ISO_TO_LIB, NAF } from "@common/dict";
import { zodFr } from "@common/utils/zod";
import { ClientBodyPortal } from "@components/utils/ClientBodyPortal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";

import { funnelStaticConfig } from "../../app/(default)/index-egapro/declaration/declarationFunnelConfiguration";
import { Grid, GridCol } from "./Grid";
import { RecapCard } from "./RecapCard";
import { Text } from "./Typography";

type Props = {
  company: CompanyDTO;
  edit?: boolean;
  full?: boolean;
  onSubmit?: (data: CompanyDTO) => void;
  title?: string;
};

// TODO: replace with tooltip when available in DSFR
const infoModale = createModal({
  id: "entreprise-info",
  isOpenedByDefault: false,
});

const companyFormModal = createModal({
  id: "company-form",
  isOpenedByDefault: false,
});

const companySchema = zodFr.object({
  name: zodFr.string(),
  city: zodFr.string(),
  address: zodFr.string(),
  nafCode: zodFr.string(),
  postalCode: zodFr.string(),
  siren: zodFr.string(),
});

export const RecapCardCompany = ({ company, full, title, edit, onSubmit }: Props) => {
  const session = useSession();
  const isStaff = session.data?.user.staff;
  const { name, address, postalCode, city, countryIsoCode, siren, nafCode, workforce, ues } = company;

  const titleFull = title ?? "Informations de l'entreprise déclarante";

  // postalCode and city may be undefined for foreign companies.
  const postalCodeCity = `${postalCode ?? ""} ${city ?? ""}`.trim();
  const countryLib =
    countryIsoCode && countryIsoCode !== "FR" && `${postalCodeCity && ", "}${COUNTRIES_ISO_TO_LIB[countryIsoCode]}`;

  const {
    register,
    handleSubmit,
    getValues,
    formState: { isValid, errors },
  } = useForm<CompanyDTO>({
    resolver: zodResolver(companySchema),
    defaultValues: company,
  });
  console.log("RecapCardCompany", isValid, errors, getValues());

  const handleOnSummit = async (data: CompanyDTO) => {
    if (onSubmit) onSubmit(data);
    companyFormModal.close();
  };

  const content = full ? (
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
            {nafCode} - {NAF[nafCode] ? NAF[nafCode].description : ""}
          </GridCol>
        )}
        <GridCol sm={12}>
          <strong>Adresse</strong>
          <br />
          {address}
          {postalCodeCity ? `, ${postalCodeCity}` : " "}
          <br />
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
      Code NAF : <strong>{nafCode}</strong> - {nafCode && NAF[nafCode] ? NAF[nafCode].description : ""}
      <br />
      {workforce?.range && (
        <>
          <br />
          Tranche d'effectifs assujettis de l'
          {ues?.name ? "UES" : "entreprise"} : <strong>{CompanyWorkforceRange.Label[workforce.range]}</strong>
        </>
      )}
    </>
  );

  const fullTitle = full ? <Text text={titleFull} variant={["xl"]} inline /> : title ?? "Informations entreprise";

  return (
    <>
      {onSubmit && (
        <ClientBodyPortal>
          <infoModale.Component title="">
            Ces informations sont renseignées automatiquement et ne sont pas modifiables (source : Répertoire Sirene de
            l'INSEE)
          </infoModale.Component>
          <companyFormModal.Component title="Modifier les informations entreprise/UES">
            <form onSubmit={handleSubmit(handleOnSummit)}>
              <Input
                nativeInputProps={{
                  ...register("name"),
                }}
                label="Entreprise déclarante *"
              />
              <Input
                nativeInputProps={{
                  ...register("address"),
                }}
                label="Adresse *"
              />
              <Input
                nativeInputProps={{
                  ...register("postalCode"),
                }}
                label="Code postale *"
              />
              <Input
                nativeInputProps={{
                  ...register("city"),
                }}
                label="Ville *"
              />
              <Input
                nativeInputProps={{
                  ...register("siren"),
                }}
                label="Siren *"
              />
              <Input
                nativeInputProps={{
                  ...register("nafCode"),
                }}
                label="Code Naf *"
              />
              <Button type="submit" disabled={!isValid}>
                Valider les modifications
              </Button>
            </form>
          </companyFormModal.Component>
        </ClientBodyPortal>
      )}
      {edit ? (
        <RecapCard title={fullTitle} editLink={funnelStaticConfig["entreprise"].url} content={content} />
      ) : (
        <RecapCard
          title={fullTitle}
          sideButtonProps={{
            iconId: "fr-icon-information-fill",
            title: titleFull,
            priority: "tertiary no outline",
            style: { alignSelf: "center" },
            size: "small",
            nativeButtonProps: isStaff ? companyFormModal.buttonProps : infoModale.buttonProps,
          }}
          content={content}
        />
      )}
    </>
  );
};
