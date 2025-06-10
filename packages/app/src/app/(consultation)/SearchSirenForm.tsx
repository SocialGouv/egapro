"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
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
    setValue,
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
          <Input
            label="Saisir le numéro Siren ou le nom de l'entreprise déclarante (privilégier le numéro Siren)"
            nativeInputProps={{
              id: "query",
              title: "Saisissez le nom ou le Siren d'une entreprise déclarante",
              type: "text",
              ...register("query"),
            }}
            stateRelatedMessage={errors.query?.message}
            state={errors.query && "error"}
            addon={
              <div className="flex items-center justify-center absolute right-0 h-full">
                {watch("query") && (
                  <Button
                    iconId="fr-icon-close-circle-fill"
                    className={fr.cx("fr-p-0", "fr-btn--sm")}
                    onClick={() => setValue("query", "")}
                    priority="tertiary no outline"
                    title="Vider le champ"
                    type="button"
                  >
                    <span className="fr-sr-only">Vider le champ</span>
                  </Button>
                )}
              </div>
            }
          />
        </GridCol>
        <GridCol sm={4}>
          <Select
            label=""
            nativeSelectProps={{
              id: "regionCode",
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

        <GridCol sm={4}>
          <Select
            label=""
            nativeSelectProps={{
              id: "countyCode",
              ...register("countyCode", {
                setValueAs: value => (value === "" ? void 0 : value),
              }),
            }}
          >
            <option value="">Département</option>
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
            label=""
            nativeSelectProps={{
              id: "nafSection",
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
