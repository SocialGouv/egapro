"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Select from "@codegouvfr/react-dsfr/Select";
import {
  type COUNTIES,
  FULL_SORTED_REGIONS_TO_COUNTIES,
  type NAF_SECTIONS,
  PUBLIC_YEARS_DESC,
  type REGIONS,
  REGIONS_TO_COUNTIES,
  SORTED_COUNTIES,
  SORTED_NAF_SECTIONS,
  SORTED_REGIONS,
} from "@common/dict";
import { omitByRecursively } from "@common/utils/object";
import { Container, Grid, GridCol } from "@design-system";
import { capitalize, isUndefined } from "lodash";
import moize from "moize";
import { usePathname, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export type AverageIndicatorFormType = {
  departement?: keyof typeof COUNTIES;
  naf?: keyof typeof NAF_SECTIONS;
  region?: keyof typeof REGIONS;
  year: string;
};

export interface AverageIndicatorFormProps {
  searchParams: AverageIndicatorFormType;
}

const yearsDisplayed = PUBLIC_YEARS_DESC.map(y => y + 1);

const getQuery = moize(
  (data: Partial<AverageIndicatorFormType>) => {
    const newData = { ...data };
    if (newData.region && newData.departement) {
      if (REGIONS_TO_COUNTIES[newData.region].includes(newData.departement)) {
        // departement is enough for filtering
        delete newData.region;
      } else {
        delete newData.departement;
      }
    }

    return new URLSearchParams(omitByRecursively(newData, isUndefined) as Partial<AverageIndicatorFormType>).toString();
  },
  { isDeepEqual: true },
);

export const AverageIndicatorForm = ({ searchParams }: AverageIndicatorFormProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { handleSubmit, register, watch } = useForm<AverageIndicatorFormType>({
    defaultValues: searchParams,
  });

  const regionSelected = watch("region");

  const onSubmit = (data: AverageIndicatorFormType) => {
    const { year: _, ...newData } = data;
    const query = getQuery(newData);
    router.push(`${pathname}/recherche?${query}`);
  };
  const onChange = (data: AverageIndicatorFormType) => {
    const query = getQuery(data);
    router.replace(`${pathname}?${query}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} onChange={handleSubmit(onChange)}>
      <Container fluid className={fr.cx("fr-btns-group--center")}>
        <Grid haveGutters align="center">
          <GridCol sm={6}>
            <Select
              label={false}
              nativeSelectProps={{
                "aria-label": "Filtre sur l'année",
                ...register("year"),
              }}
            >
              <option disabled hidden>
                Année de déclaration
              </option>
              {yearsDisplayed.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </GridCol>
          <GridCol sm={6}>
            <Select
              label={false}
              nativeSelectProps={{
                "aria-label": "Filtre sur la région",
                ...register("region", {
                  setValueAs: value => (value === "" ? void 0 : value),
                }),
              }}
            >
              <option value="">Région</option>
              {SORTED_REGIONS.map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </Select>
          </GridCol>
          <GridCol sm={6}>
            <Select
              label={false}
              nativeSelectProps={{
                "aria-label": "Filtre sur le département",
                ...register("departement", {
                  setValueAs: value => (value === "" ? void 0 : value),
                }),
              }}
            >
              <option value="">Département</option>
              {(regionSelected ? FULL_SORTED_REGIONS_TO_COUNTIES[regionSelected] : SORTED_COUNTIES).map(
                ([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ),
              )}
            </Select>
          </GridCol>
          <GridCol sm={6}>
            <Select
              label={false}
              nativeSelectProps={{
                "aria-label": "Filtre sur le secteur d'activité",
                ...register("naf", {
                  setValueAs: value => (value === "" ? void 0 : value),
                }),
              }}
            >
              <option value="">Secteur d'activité</option>
              {SORTED_NAF_SECTIONS.map(([key, value]) => (
                <option key={key} value={key}>
                  {capitalize(value)}
                </option>
              ))}
            </Select>
          </GridCol>
        </Grid>
        <Button title="Voir les entreprises" className={fr.cx("fr-mt-3w")}>
          Voir les entreprises
        </Button>
      </Container>
    </form>
  );
};
