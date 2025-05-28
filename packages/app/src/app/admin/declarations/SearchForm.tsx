"use client";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import {
  type SearchAdminDeclarationDTO,
  type SearchAdminDeclarationInput,
  searchAdminDeclarationInput,
} from "@common/core-domain/dtos/SearchDeclarationDTO";
import { YEARS } from "@common/dict";
import { dateObjectToDateISOString } from "@common/utils/date";
import { omitByRecursively } from "@common/utils/object";
import { Grid, GridCol } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { isUndefined } from "lodash";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";

export interface SearchFormProps {
  searchParams: SearchAdminDeclarationInput;
}

const emptyInputIsUndefined = (value: string) => (value === "" ? void 0 : value);

export const SearchForm = ({ searchParams }: SearchFormProps) => {
  const router = useRouter();

  const {
    formState: { errors, isValid },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<SearchAdminDeclarationInput>({
    resolver: zodResolver(searchAdminDeclarationInput),
    mode: "onChange",
  });

  const resetInputs = useCallback(
    (params: SearchAdminDeclarationInput) => {
      reset(params);
    },
    [reset],
  );

  // Sync form data with URL params.
  useEffect(() => {
    resetInputs(searchParams);
  }, [resetInputs, searchParams]);

  function onSubmit(data: SearchAdminDeclarationInput) {
    const cleaned = omitByRecursively(data, isUndefined) as unknown as Partial<SearchAdminDeclarationDTO>; // parsed by zod
    if (cleaned.indexComparison && typeof cleaned.index === "undefined") {
      delete cleaned.indexComparison;
    }
    if (!cleaned.ues) {
      delete cleaned.ues;
    }

    const currentUrl = new URL(location.href);
    const orderBy = currentUrl.searchParams.get("orderBy");
    const orderDirection = currentUrl.searchParams.get("orderDirection");
    const limit = currentUrl.searchParams.get("limit");
    if (orderBy) {
      cleaned.orderBy = orderBy as typeof cleaned.orderBy;
    }
    if (orderDirection) {
      cleaned.orderDirection = orderDirection as typeof cleaned.orderDirection;
    }
    if (limit) {
      cleaned.limit = parseInt(limit, 10) as typeof cleaned.limit;
    }

    router.replace(`${location.pathname}?${new URLSearchParams(cleaned as URLSearchParams).toString()}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Grid haveGutters>
        <GridCol sm={3}>
          <Input
            label="Nom ou Siren de l'entreprise"
            nativeInputProps={{
              id: "query",
              title: "Saisissez une requête",
              autoComplete: "off",
              type: "search",
              ...register("query", {
                setValueAs: emptyInputIsUndefined,
              }),
            }}
            state={errors.query && "error"}
            stateRelatedMessage={errors.query?.message}
          />
        </GridCol>
        <GridCol sm={3}>
          <Input
            label="Email du déclarant"
            nativeInputProps={{
              id: "email",
              title: "Saisissez une requête",
              autoComplete: "off",
              type: "search",
              ...register("email", {
                setValueAs: emptyInputIsUndefined,
              }),
            }}
            state={errors.email && "error"}
            stateRelatedMessage={errors.email?.message}
          />
        </GridCol>
        <GridCol sm={3}>
          <Input
            label="Date minimum"
            nativeInputProps={{
              ...register("minDate", {
                setValueAs: emptyInputIsUndefined,
              }),
              type: "date",
              max: watch("maxDate"),
            }}
            state={errors.minDate && "error"}
            stateRelatedMessage={errors.minDate?.message}
          />
        </GridCol>
        <GridCol sm={3}>
          <Input
            label="Date maximum"
            nativeInputProps={{
              ...register("maxDate", {
                setValueAs: emptyInputIsUndefined,
              }),
              type: "date",
              min: watch("minDate"),
              max: dateObjectToDateISOString(new Date()),
            }}
            state={errors.maxDate && "error"}
            stateRelatedMessage={errors.maxDate?.message}
          />
        </GridCol>
        <GridCol sm={2}>
          <Select
            label="Index"
            nativeSelectProps={{
              ...register("indexComparison"),
            }}
            state={errors.indexComparison && "error"}
            stateRelatedMessage={errors.indexComparison?.message}
          >
            <option value="eq">=</option>
            <option value="lt">&lt;</option>
            <option value="gt">&gt;</option>
          </Select>
        </GridCol>
        <GridCol sm={2}>
          <Input
            label=" "
            nativeInputProps={{
              ...register("index", {
                setValueAs: (value: string) => parseInt(value, 10) || void 0,
              }),
              type: "number",
              min: 0,
              max: 100,
              step: 1,
            }}
            state={errors.index && "error"}
            stateRelatedMessage={errors.index?.message}
          />
        </GridCol>
        <GridCol sm={3}>
          <Select
            label="Année indicateurs"
            nativeSelectProps={{
              ...register("year", {
                setValueAs: emptyInputIsUndefined,
              }),
            }}
            state={errors.year && "error"}
            stateRelatedMessage={errors.year?.message}
          >
            <option value="">Sélectionnez une année</option>
            {YEARS.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </GridCol>
        <GridCol sm={3} className="flex">
          <Checkbox
            className="fr-mb-0 self-end"
            options={[
              {
                label: "Les UES uniquement ?",
                nativeInputProps: register("ues", {
                  setValueAs: value => value || void 0,
                }),
              },
            ]}
            state={errors.ues && "error"}
            stateRelatedMessage={errors.ues?.message}
          />
        </GridCol>
        <GridCol>
          <ButtonsGroup
            inlineLayoutWhen="sm and up"
            buttons={[
              {
                title: "Rechercher",
                children: "Rechercher",
                disabled: !isValid,
                type: "submit",
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
