"use client";

import { fr } from "@codegouvfr/react-dsfr";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Select from "@codegouvfr/react-dsfr/Select";
import { type GetDeclarationStatsInput } from "@common/core-domain/dtos/SearchDeclarationDTO";
import {
  FULL_SORTED_REGIONS_TO_COUNTIES,
  PUBLIC_YEARS_DESC,
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

type AverageIndicatorFormType = Omit<GetDeclarationStatsInput, "limit" | "page">;

export interface AverageIndicatorFormProps {
  searchParams: AverageIndicatorFormType;
}

const yearsDisplayed = PUBLIC_YEARS_DESC.map(y => y + 1);

const deepEqualMoize = moize({ isDeepEqual: true });
type NoYearAverageIndicatorFormType = Omit<AverageIndicatorFormType, "year">;
const getQuery = deepEqualMoize((data: Partial<GetDeclarationStatsInput>) => {
  const newData = { ...data };
  if (newData.regionCode && newData.countyCode) {
    if (REGIONS_TO_COUNTIES[newData.regionCode].includes(newData.countyCode)) {
      // county is enough by itself for filtering
      delete newData.regionCode;
    } else {
      delete newData.countyCode;
    }
  }

  return new URLSearchParams(omitByRecursively(newData, isUndefined) as NoYearAverageIndicatorFormType).toString();
});

export const AverageIndicatorForm = ({ searchParams }: AverageIndicatorFormProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { handleSubmit, register, watch } = useForm<AverageIndicatorFormType>({
    defaultValues: searchParams,
  });

  const regionSelected = watch("regionCode");

  const onSubmit = (data: AverageIndicatorFormType) => {
    const { year: _, ...newData } = data;
    newData.query = "";
    const query = getQuery(newData);
    router.push(`${pathname}?${query}`);
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
                title: "Année de déclaration",
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
                title: "Région",
                ...register("regionCode", {
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
                title: "Département",
                ...register("countyCode", {
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
                title: "Secteur d'activité",
                ...register("nafSection", {
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
        <ButtonsGroup
          className={fr.cx("fr-mt-3w")}
          alignment="center"
          inlineLayoutWhen="sm and up"
          buttons={[
            {
              title: "Voir les entreprises",
              children: "Voir les entreprises",
            },
            {
              title: "Réinitialiser",
              children: "Réinitialiser",
              disabled: !Object.values(watch()).filter(Boolean).length,
              type: "reset",
              priority: "secondary",
              onClick() {
                router.replace(`${location.origin}${location.pathname}`);
              },
            },
          ]}
        />
      </Container>
    </form>
  );
};
