"use client";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { Select } from "@codegouvfr/react-dsfr/Select";
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

const countiesCodes = [
  "01",
  "02",
  "2A",
  "2B",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29",
  "30",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "49",
  "50",
  "51",
  "52",
  "53",
  "54",
  "55",
  "56",
  "57",
  "58",
  "59",
  "60",
  "61",
  "62",
  "63",
  "64",
  "65",
  "66",
  "67",
  "68",
  "69",
  "70",
  "71",
  "72",
  "73",
  "74",
  "75",
  "76",
  "77",
  "78",
  "79",
  "80",
  "81",
  "82",
  "83",
  "84",
  "85",
  "86",
  "87",
  "88",
  "89",
  "90",
  "91",
  "92",
  "93",
  "94",
  "95",
  "971",
  "972",
  "973",
  "974",
  "976",
] as const;

const regionCodes = [
  "01",
  "02",
  "03",
  "04",
  "06",
  "11",
  "24",
  "27",
  "28",
  "32",
  "44",
  "52",
  "53",
  "75",
  "76",
  "84",
  "93",
  "94",
] as const;

const companySchema = zodFr.object({
  name: zodFr.string(),
  city: zodFr.string(),
  address: zodFr.string(),
  nafCode: zodFr.string(),
  postalCode: zodFr.string(),
  siren: zodFr.string(),
  county: zodFr.enum(countiesCodes).optional(),
  region: zodFr.enum(regionCodes).optional(),
});

export const RecapCardCompany = ({ company, full, title, edit, onSubmit }: Props) => {
  const session = useSession();
  const isStaff = session.data?.user.staff;
  const { name, address, postalCode, city, countryIsoCode, siren, nafCode, workforce, ues, county, region } = company;

  const titleFull = title ?? "Informations de l'entreprise déclarante";

  // postalCode and city may be undefined for foreign companies.
  const postalCodeCity = `${postalCode ?? ""} ${city ?? ""}`.trim();
  const countryLib =
    countryIsoCode && countryIsoCode !== "FR" && `${postalCodeCity && ", "}${COUNTRIES_ISO_TO_LIB[countryIsoCode]}`;

  const {
    register,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm<CompanyDTO>({
    resolver: zodResolver(companySchema),
    defaultValues: company,
  });

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
      {county && `Département : ${county}`}
      {region && `Région : ${region}`}
      {(county || region) && <br />}
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
              <Select label="Département *" nativeSelectProps={register("county")}>
                <option value="" disabled>
                  Sélectionnez un département
                </option>
                {countiesCodes.map(code => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </Select>
              <Select label="Région *" nativeSelectProps={register("region")}>
                <option value="" disabled>
                  Sélectionnez une région
                </option>
                {regionCodes.map(code => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </Select>
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
            iconId: "fr-icon-edit-line",
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
