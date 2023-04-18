"use client";

import {
  type COUNTIES,
  FULL_SORTED_REGIONS_TO_COUNTIES,
  type NAF_SECTIONS,
  type REGIONS,
  SORTED_NAF_SECTIONS,
  SORTED_REGIONS,
} from "@common/dict";
import { omitByRecursively } from "@common/utils/object";
import { capitalize } from "@common/utils/string";
import _ from "lodash";
import { useRouter } from "next/navigation";
import {
  ButtonGroup,
  FormButton,
  FormGroup,
  FormGroupLabel,
  FormGroupMessage,
  FormInput,
  FormSelect,
} from "packages/app/src/design-system/server";
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
        omitByRecursively(data, _.isUndefined) as Partial<FormTypeInput>,
      ).toString()}`,
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12">
          <FormGroup>
            <FormGroupLabel htmlFor="q">Nom ou numéro Siren de l’entreprise</FormGroupLabel>
            <FormInput
              id="q"
              placeholder="Saisissez le nom ou le Siren d'une entreprise"
              {...register("q")}
              aria-describedby={errors.q && "q-message-error"}
              autoComplete="off"
            />
            {errors.q && <FormGroupMessage id="q-message-error">{errors.q.message}</FormGroupMessage>}
          </FormGroup>
        </div>
        <div className="fr-col-12 fr-col-sm-4">
          <FormGroup>
            <FormSelect id="region" {...register("region")} aria-describedby={errors.region && "region-message-error"}>
              <option value="">Région</option>
              {SORTED_REGIONS.map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </FormSelect>
          </FormGroup>
        </div>

        <div className="fr-col-12 fr-col-sm-4">
          <FormGroup>
            <FormSelect
              id="departement"
              {...register("departement")}
              aria-describedby={errors.departement && "departement-message-error"}
            >
              <option value="">Département</option>
              {regionSelected &&
                FULL_SORTED_REGIONS_TO_COUNTIES[regionSelected].map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
            </FormSelect>
          </FormGroup>
        </div>

        <div className="fr-col-12 fr-col-sm-4">
          <FormGroup>
            <FormSelect id="naf" {...register("naf")} aria-describedby={errors.naf && "naf-message-error"}>
              <option value="">Secteur d'activité</option>
              {SORTED_NAF_SECTIONS.map(([key, value]) => (
                <option key={key} value={key}>
                  {capitalize(value)}
                </option>
              ))}
            </FormSelect>
          </FormGroup>
        </div>

        <div className="fr-col-12">
          <ButtonGroup inline="mobile-up">
            <FormButton>Rechercher</FormButton>
            <FormButton
              variant="secondary"
              type="reset"
              isDisabled={!Object.values(watch()).filter(Boolean).length}
              onClick={() => {
                resetInputs({});
                router.replace(`${location.origin}${location.pathname}?q=`);
              }}
            >
              Réinitialiser
            </FormButton>
          </ButtonGroup>
        </div>
      </div>
    </form>
  );
};
