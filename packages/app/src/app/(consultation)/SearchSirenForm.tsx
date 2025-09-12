"use client";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { type ConsultationInput, consultationSchema } from "@common/core-domain/dtos/helpers/common";
import { COUNTY_TO_REGION, FULL_SORTED_REGIONS_TO_COUNTIES, SORTED_NAF_SECTIONS, SORTED_REGIONS } from "@common/dict";
import { omitByRecursively } from "@common/utils/object";
import { Grid, GridCol } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { capitalize, isUndefined } from "lodash";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";

import styles from "./SearchSirenForm.module.scss";

type SearchSirenFormInput = ConsultationInput;
export interface SearchSirenFormProps {
  searchParams: SearchSirenFormInput;
}

export const SearchSirenForm = ({ searchParams }: SearchSirenFormProps) => {
  const router = useRouter();

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<SearchSirenFormInput>({
    resolver: zodResolver(consultationSchema),
  });

  const resetInputs = useCallback(
    (params: SearchSirenFormInput) => {
      reset(params);
    },
    [reset],
  );

  // Sync form data with URL params.
  useEffect(() => {
    if (searchParams.countyCode && !searchParams.regionCode) {
      searchParams.regionCode = COUNTY_TO_REGION[searchParams.countyCode];
    }
    resetInputs(searchParams);
  }, [resetInputs, searchParams]);

  const regionSelected = watch("regionCode");

  function onSubmit(data: SearchSirenFormInput) {
    router.replace(
      `${location.pathname}?${new URLSearchParams(
        omitByRecursively(data, isUndefined) as Partial<SearchSirenFormInput>,
      ).toString()}`,
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Grid haveGutters>
        <GridCol>
          <div className={styles.searchContainer}>
            <Input
              label="Saisir le numéro Siren ou le nom de l'entreprise déclarante (privilégier le numéro Siren)"
              nativeInputProps={{
                id: "query",
                title: "Saisissez le nom ou le Siren d'une entreprise déclarante",
                autoComplete: "off",
                type: "text",
                ...register("query"),
              }}
              stateRelatedMessage={errors.query?.message}
              state={errors.query && "error"}
            />
            {watch("query") && (
              <button
                type="button"
                onClick={() => {
                  reset({ ...watch(), query: "" });
                }}
                aria-label="Effacer la recherche"
                title="Effacer la recherche"
                className={styles.clearButton}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM12 10.9L10.9 12L8 9.1L5.1 12L4 10.9L6.9 8L4 5.1L5.1 4L8 6.9L10.9 4L12 5.1L9.1 8L12 10.9Z"
                    fill="#666666"
                  />
                </svg>
              </button>
            )}
          </div>
        </GridCol>
        <GridCol sm={4}>
          <Select
            label="Région"
            nativeSelectProps={{
              id: "regionCode",
              title: "Région",
              ...register("regionCode", {
                setValueAs: value => (value === "" ? void 0 : value),
              }),
            }}
          >
            <option></option>
            {SORTED_REGIONS.map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </Select>
        </GridCol>

        <GridCol sm={4}>
          <Select
            label="Département"
            nativeSelectProps={{
              id: "countyCode",
              title: "Département",
              ...register("countyCode", {
                setValueAs: value => (value === "" ? void 0 : value),
              }),
            }}
          >
            <option></option>
            {regionSelected &&
              FULL_SORTED_REGIONS_TO_COUNTIES[regionSelected].map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
          </Select>
        </GridCol>

        <GridCol sm={4}>
          <Select
            label="Secteur d'activité"
            nativeSelectProps={{
              id: "nafSection",
              title: "Secteur d'activité",
              ...register("nafSection", {
                setValueAs: value => (value === "" ? void 0 : value),
              }),
            }}
          >
            <option></option>
            {SORTED_NAF_SECTIONS.map(([key, value]) => (
              <option key={key} value={key}>
                {capitalize(value)}
              </option>
            ))}
          </Select>
        </GridCol>

        <GridCol>
          <ButtonsGroup
            inlineLayoutWhen="sm and up"
            buttons={[
              {
                title: "Rechercher",
                children: "Rechercher",
              },
              {
                title: "Réinitialiser",
                children: "Réinitialiser",
                disabled: !Object.values(watch()).filter(Boolean).length,
                type: "reset",
                priority: "secondary",
                onClick() {
                  router.replace(`${location.origin}${location.pathname}?query=`);
                },
              },
            ]}
          />
        </GridCol>
      </Grid>
    </form>
  );
};
