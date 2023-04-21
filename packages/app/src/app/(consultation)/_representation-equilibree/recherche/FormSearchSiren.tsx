"use client";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import {
  type COUNTIES,
  FULL_SORTED_REGIONS_TO_COUNTIES,
  type NAF_SECTIONS,
  type REGIONS,
  SORTED_NAF_SECTIONS,
  SORTED_REGIONS,
} from "@common/dict";
import { omitByRecursively } from "@common/utils/object";
import { Grid, GridCol } from "@design-system";
import { capitalize, isUndefined } from "lodash";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";

export type FormTypeInput = {
  departement?: keyof typeof COUNTIES;
  naf?: keyof typeof NAF_SECTIONS;
  q?: string;
  region?: keyof typeof REGIONS;
};

export interface FormSearchSirenProps {
  searchParams: FormTypeInput;
}

export const FormSearchSiren = ({ searchParams }: FormSearchSirenProps) => {
  const router = useRouter();

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    watch,
    // setValue,
  } = useForm<FormTypeInput>(); // Using defaultValues would not be enough here, because we fetch params.query which is not present at the first rehydration time (see Next.js docs). So we use reset API below.

  const resetInputs = useCallback(
    (params: FormTypeInput) => {
      reset({
        region: params.region,
        departement: params.departement,
        naf: params.naf,
        q: params.q,
      });
    },
    [reset],
  );

  // Sync form data with URL params.
  useEffect(() => {
    resetInputs(searchParams);
  }, [resetInputs, searchParams]);

  const regionSelected = watch("region");

  function onSubmit(data: FormTypeInput) {
    router.replace(
      `${location.pathname}?${new URLSearchParams(
        omitByRecursively(data, isUndefined) as Partial<FormTypeInput>,
      ).toString()}`,
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Grid haveGutters>
        <GridCol>
          <Input
            label="Nom ou numéro Siren de l’entreprise"
            nativeInputProps={{
              id: "q",
              placeholder: "Saisissez le nom ou le Siren d'une entreprise",
              autoComplete: "off",
              ...register("q"),
            }}
            stateRelatedMessage={errors.q?.message}
            state={errors.q ? "error" : "default"}
          />
        </GridCol>
        <GridCol sm={4}>
          <Select
            label=""
            nativeSelectProps={{
              id: "region",
              ...register("region"),
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
              id: "departement",
              ...register("departement"),
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
              id: "naf",
              ...register("naf"),
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
                  resetInputs({});
                  router.replace(`${location.origin}${location.pathname}?q=`);
                },
              },
            ]}
          />
        </GridCol>
      </Grid>
    </form>
  );
};
