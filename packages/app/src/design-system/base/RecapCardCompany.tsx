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
import { useState } from "react";
import { useForm } from "react-hook-form";

import { funnelStaticConfig } from "../../app/(default)/index-egapro/declaration/declarationFunnelConfiguration";
import { Grid, GridCol } from "./Grid";
import { RecapCard } from "./RecapCard";
import { Text } from "./Typography";

type Props = {
  company: CompanyDTO;
  full?: boolean;
  mode: "admin" | "edit" | "view";
  onSubmit?: (data: CompanyDTO) => void;
  title?: string;
};

const infoModale = createModal({
  id: "entreprise-info",
  isOpenedByDefault: false,
});

const companyFormModal = createModal({
  id: "company-form",
  isOpenedByDefault: false,
});

const counties = [
  { value: "01", label: "Ain" },
  { value: "02", label: "Aisne" },
  { value: "03", label: "Allier" },
  { value: "04", label: "Alpes-de-Haute-Provence" },
  { value: "05", label: "Hautes-Alpes" },
  { value: "06", label: "Alpes-Maritimes" },
  { value: "07", label: "Ardèche" },
  { value: "08", label: "Ardennes" },
  { value: "09", label: "Ariège" },
  { value: "10", label: "Aube" },
  { value: "11", label: "Aude" },
  { value: "12", label: "Aveyron" },
  { value: "13", label: "Bouches-du-Rhône" },
  { value: "14", label: "Calvados" },
  { value: "15", label: "Cantal" },
  { value: "16", label: "Charente" },
  { value: "17", label: "Charente-Maritime" },
  { value: "18", label: "Cher" },
  { value: "19", label: "Corrèze" },
  { value: "2A", label: "Corse-du-Sud" },
  { value: "2B", label: "Haute-Corse" },
  { value: "21", label: "Côte-d'Or" },
  { value: "22", label: "Côtes-d'Armor" },
  { value: "23", label: "Creuse" },
  { value: "24", label: "Dordogne" },
  { value: "25", label: "Doubs" },
  { value: "26", label: "Drôme" },
  { value: "27", label: "Eure" },
  { value: "28", label: "Eure-et-Loir" },
  { value: "29", label: "Finistère" },
  { value: "30", label: "Gard" },
  { value: "31", label: "Haute-Garonne" },
  { value: "32", label: "Gers" },
  { value: "33", label: "Gironde" },
  { value: "34", label: "Hérault" },
  { value: "35", label: "Ille-et-Vilaine" },
  { value: "36", label: "Indre" },
  { value: "37", label: "Indre-et-Loire" },
  { value: "38", label: "Isère" },
  { value: "39", label: "Jura" },
  { value: "40", label: "Landes" },
  { value: "41", label: "Loir-et-Cher" },
  { value: "42", label: "Loire" },
  { value: "43", label: "Haute-Loire" },
  { value: "44", label: "Loire-Atlantique" },
  { value: "45", label: "Loiret" },
  { value: "46", label: "Lot" },
  { value: "47", label: "Lot-et-Garonne" },
  { value: "48", label: "Lozère" },
  { value: "49", label: "Maine-et-Loire" },
  { value: "50", label: "Manche" },
  { value: "51", label: "Marne" },
  { value: "52", label: "Haute-Marne" },
  { value: "53", label: "Mayenne" },
  { value: "54", label: "Meurthe-et-Moselle" },
  { value: "55", label: "Meuse" },
  { value: "56", label: "Morbihan" },
  { value: "57", label: "Moselle" },
  { value: "58", label: "Nièvre" },
  { value: "59", label: "Nord" },
  { value: "60", label: "Oise" },
  { value: "61", label: "Orne" },
  { value: "62", label: "Pas-de-Calais" },
  { value: "63", label: "Puy-de-Dôme" },
  { value: "64", label: "Pyrénées-Atlantiques" },
  { value: "65", label: "Hautes-Pyrénées" },
  { value: "66", label: "Pyrénées-Orientales" },
  { value: "67", label: "Bas-Rhin" },
  { value: "68", label: "Haut-Rhin" },
  { value: "69", label: "Rhône" },
  { value: "70", label: "Haute-Saône" },
  { value: "71", label: "Saône-et-Loire" },
  { value: "72", label: "Sarthe" },
  { value: "73", label: "Savoie" },
  { value: "74", label: "Haute-Savoie" },
  { value: "75", label: "Paris" },
  { value: "76", label: "Seine-Maritime" },
  { value: "77", label: "Seine-et-Marne" },
  { value: "78", label: "Yvelines" },
  { value: "79", label: "Deux-Sèvres" },
  { value: "80", label: "Somme" },
  { value: "81", label: "Tarn" },
  { value: "82", label: "Tarn-et-Garonne" },
  { value: "83", label: "Var" },
  { value: "84", label: "Vaucluse" },
  { value: "85", label: "Vendée" },
  { value: "86", label: "Vienne" },
  { value: "87", label: "Haute-Vienne" },
  { value: "88", label: "Vosges" },
  { value: "89", label: "Yonne" },
  { value: "90", label: "Territoire de Belfort" },
  { value: "91", label: "Essonne" },
  { value: "92", label: "Hauts-de-Seine" },
  { value: "93", label: "Seine-Saint-Denis" },
  { value: "94", label: "Val-de-Marne" },
  { value: "95", label: "Val-d'Oise" },
  { value: "971", label: "Guadeloupe" },
  { value: "972", label: "Martinique" },
  { value: "973", label: "Guyane" },
  { value: "974", label: "La Réunion" },
  { value: "976", label: "Mayotte" },
];

const regions = [
  { value: "84", label: "Auvergne-Rhône-Alpes" },
  { value: "27", label: "Bourgogne-Franche-Comté" },
  { value: "53", label: "Bretagne" },
  { value: "24", label: "Centre-Val de Loire" },
  { value: "94", label: "Corse" },
  { value: "44", label: "Grand Est" },
  { value: "01", label: "Guadeloupe" },
  { value: "03", label: "Guyane" },
  { value: "32", label: "Hauts-de-France" },
  { value: "11", label: "Île-de-France" },
  { value: "02", label: "Martinique" },
  { value: "04", label: "La Réunion" },
  { value: "28", label: "Normandie" },
  { value: "75", label: "Nouvelle-Aquitaine" },
  { value: "76", label: "Occitanie" },
  { value: "52", label: "Pays de la Loire" },
  { value: "93", label: "Provence-Alpes-Côte d'Azur" },
  { value: "06", label: "Mayotte" },
];

export const regionCodes = regions.map(region => region.value) as [string, ...string[]];
export const countiesCodes = counties.map(county => county.value) as [string, ...string[]];

// Schéma de validation modifié pour rendre les champs d'adresse optionnels lorsque le pays n'est pas la France
const companySchema = zodFr
  .object({
    name: zodFr.string(),
    // Ces champs sont optionnels par défaut
    city: zodFr.string().optional(),
    address: zodFr.string().optional(),
    postalCode: zodFr.string().optional(),
    nafCode: zodFr.string(),
    siren: zodFr.string(),
    county: zodFr.enum(countiesCodes).optional(),
    region: zodFr.enum(regionCodes).optional(),
    countryIsoCode: zodFr.string(),
    workforce: zodFr
      .object({
        range: zodFr.enum([
          CompanyWorkforceRange.Enum.FROM_50_TO_250,
          CompanyWorkforceRange.Enum.FROM_251_TO_999,
          CompanyWorkforceRange.Enum.FROM_1000_TO_MORE,
        ]),
      })
      .optional(),
  })
  .refine(
    // Validation conditionnelle : si le pays est la France, les champs d'adresse sont requis
    data => {
      if (data.countryIsoCode === "FR") {
        return !!data.city && !!data.address && !!data.postalCode;
      }
      return true; // Si le pays n'est pas la France, pas de validation supplémentaire
    },
    {
      message: "Les champs Adresse, Ville et Code postal sont requis pour la France",
      path: ["countryIsoCode"], // Le message d'erreur sera associé au champ pays
    },
  );

const cleanAddress = (city: string | undefined, postalCode: string | undefined, address: string) => {
  let newAdress = address;
  if (city) newAdress = newAdress.replace(city, "");
  if (postalCode) newAdress = newAdress.replace(postalCode, "");

  return newAdress;
};

export const RecapCardCompany = ({ company, full, title, mode, onSubmit }: Props) => {
  const session = useSession();
  const isStaff = session.data?.user.staff;
  const { name, address, postalCode, city, countryIsoCode, siren, nafCode, workforce, ues, county, region } = company;

  // État pour suivre le pays sélectionné
  const [selectedCountry, setSelectedCountry] = useState(countryIsoCode || "");
  const isFrance = selectedCountry === "FR";

  const countyName = county && counties.find(c => c.value === county)?.label;
  const regionName = region && regions.find(r => r.value === region)?.label;

  const titleFull = title ?? "Informations de l'entreprise déclarante";

  // postalCode and city may be undefined for foreign companies.
  const postalCodeCity = `${postalCode ?? ""} ${city ?? ""}`.trim();
  const countryLib = countryIsoCode && countryIsoCode !== "FR" && COUNTRIES_ISO_TO_LIB[countryIsoCode];

  const {
    register,
    handleSubmit,
    formState: { isValid, errors },
    setValue,
    watch,
    getValues,
  } = useForm<CompanyDTO>({
    resolver: zodResolver(companySchema),
    defaultValues: company,
    mode: "all", // Valider le formulaire en continu
  });
  // Nous n'avons plus besoin de cet effet car le gestionnaire d'événements onChange du champ de sélection du pays
  // s'occupe déjà de mettre à jour selectedCountry et de vider les champs si nécessaire

  const handleOnSummit = async (data: CompanyDTO) => {
    // Si le pays n'est pas la France, vider les champs département, adresse, code postal et ville
    // avant de soumettre le formulaire
    if (data.countryIsoCode !== "FR") {
      data.county = undefined;
      data.region = undefined;
      data.city = "";
      data.postalCode = "";
      data.address = "";
    }

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
          {cleanAddress(city, postalCode, address as string)}
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
      {cleanAddress(city, postalCode, address as string)}
      {(postalCodeCity || countryLib) && <br />}
      {postalCodeCity}
      <br />
      {countyName && `Département : ${countyName}`}
      <br />
      {regionName && `Région : ${regionName}`}
      {(county || region) && <br />}
      {countryIsoCode && countryIsoCode !== "FR" && `Pays : ${countryLib}`}
      {countryIsoCode && countryIsoCode !== "FR" && <br />}
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
      <ClientBodyPortal>
        <infoModale.Component title="">
          Ces informations sont renseignées automatiquement et ne sont pas modifiables (source : Répertoire Sirene de
          l'INSEE)
        </infoModale.Component>
        {onSubmit && (
          <companyFormModal.Component title="Modifier les informations entreprise/UES">
            <form onSubmit={handleSubmit(handleOnSummit)} name="representation-equilibree-entreprise">
              <Input
                nativeInputProps={{
                  ...register("name"),
                }}
                label="Entreprise déclarante *"
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
              <Select
                label="Pays *"
                nativeSelectProps={{
                  ...register("countryIsoCode", {
                    onChange: e => {
                      // Mettre à jour uniquement l'état local sans vider les champs
                      const value = e.target.value;
                      setSelectedCountry(value);
                    },
                  }),
                }}
              >
                <option value="" disabled>
                  Sélectionnez un pays
                </option>
                {Object.keys(COUNTRIES_ISO_TO_LIB)
                  .sort((a, b) => {
                    if (COUNTRIES_ISO_TO_LIB[a] < COUNTRIES_ISO_TO_LIB[b]) return -1;
                    return 1;
                  })
                  .map(countryCode => (
                    <option key={countryCode} value={countryCode}>
                      {COUNTRIES_ISO_TO_LIB[countryCode]}
                    </option>
                  ))}
              </Select>
              {/* Afficher les champs adresse, code postal et ville uniquement si le pays est la France */}
              {isFrance && (
                <>
                  <Input
                    nativeInputProps={{
                      ...register("address"),
                    }}
                    label="Adresse *"
                  />
                  <Input
                    nativeInputProps={{
                      ...register("city"),
                    }}
                    label="Ville *"
                  />
                  <Input
                    nativeInputProps={{
                      ...register("postalCode"),
                    }}
                    label="Code postal *"
                  />
                </>
              )}
              {/* Afficher les champs département et région uniquement si le pays est la France */}
              {isFrance && (
                <>
                  <Select label="Département *" nativeSelectProps={register("county")}>
                    <option value="" disabled>
                      Sélectionnez un département
                    </option>
                    {counties.map(county => (
                      <option key={county.value} value={county.value}>
                        {county.label}
                      </option>
                    ))}
                  </Select>
                  <Select label="Région *" nativeSelectProps={register("region")}>
                    <option value="" disabled>
                      Sélectionnez une région
                    </option>
                    {regions.map(region => (
                      <option key={region.value} value={region.value}>
                        {region.label}
                      </option>
                    ))}
                  </Select>
                </>
              )}

              <Select
                label="Tranche d'effectifs assujettis de l'entreprise *"
                nativeSelectProps={register("workforce.range")}
                state="default"
                disabled={true}
              >
                <option value="" disabled>
                  Sélectionnez une tranche d'effectifs
                </option>
                <option value={CompanyWorkforceRange.Enum.FROM_50_TO_250}>
                  {CompanyWorkforceRange.Label[CompanyWorkforceRange.Enum.FROM_50_TO_250]}
                </option>
                <option value={CompanyWorkforceRange.Enum.FROM_251_TO_999}>
                  {CompanyWorkforceRange.Label[CompanyWorkforceRange.Enum.FROM_251_TO_999]}
                </option>
                <option value={CompanyWorkforceRange.Enum.FROM_1000_TO_MORE}>
                  {CompanyWorkforceRange.Label[CompanyWorkforceRange.Enum.FROM_1000_TO_MORE]}
                </option>
              </Select>

              <Button
                type="button"
                onClick={() => {
                  // Récupérer les valeurs actuelles du formulaire avec getValues()
                  const formValues = getValues();

                  // Appeler directement handleOnSummit avec les valeurs du formulaire
                  handleOnSummit(formValues);
                }}
              >
                Valider les modifications
              </Button>
            </form>
          </companyFormModal.Component>
        )}
      </ClientBodyPortal>

      {mode === "edit" && (
        <RecapCard title={fullTitle} editLink={funnelStaticConfig["entreprise"].url} content={content} />
      )}
      {mode === "admin" && (
        <RecapCard
          title={fullTitle}
          isStaff={isStaff}
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
      {mode === "view" && (
        <RecapCard
          title={fullTitle}
          isStaff={isStaff}
          sideButtonProps={{
            iconId: "fr-icon-info-fill",
            title: titleFull,
            priority: "tertiary no outline",
            style: { alignSelf: "center" },
            size: "small",
            nativeButtonProps: infoModale.buttonProps,
          }}
          content={content}
        />
      )}
    </>
  );
};
