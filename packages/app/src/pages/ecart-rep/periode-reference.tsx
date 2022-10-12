import { zodResolver } from "@hookform/resolvers/zod";
import { endOfYear, getYear, formatISO, isValid, parseISO } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUser } from "../../hooks/useUser";
import { useFormManager } from "../../services/apiClient/form-manager";
import type { NextPageWithLayout } from "../_app";
import { ClientAuthenticatedOnly } from "@components/ClientAuthenticatedOnly";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";
import {
  ButtonAsLink,
  FormGroup,
  FormGroupMessage,
  FormGroupLabel,
  FormInput,
  FormButton,
  FormLayout,
  FormLayoutButtonGroup,
} from "@design-system";

const title = "Période de référence";

const formSchema = z
  .object({
    year: z.string().min(1, "L'année est requise."),
    endOfPeriod: z.string().refine(val => isValid(val) || isValid(parseISO(val)), {
      message: "La date de fin de période de référence est de la forme jj/mm/aaaa.",
    }),
  })
  .superRefine(({ year, endOfPeriod }, ctx) => {
    if (getYear(new Date(endOfPeriod)) !== Number(year)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "La date de fin de période de référence doit correspondre à l'année au titre de laquelle les écarts de représentation sont calculés",
        path: ["endOfPeriod"],
      });
    }
  });

type FormType = z.infer<typeof formSchema>;

const PeriodeReference: NextPageWithLayout = () => {
  const router = useRouter();
  useUser({ redirectTo: "/ecart-rep/email" });
  const { formData, saveFormData } = useFormManager();

  const {
    formState: { errors, isDirty, isValid, isSubmitted },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<FormType>({
    mode: "onBlur",
    resolver: zodResolver(formSchema),
  });

  const resetForm = useCallback(() => {
    reset({
      endOfPeriod: formData?.endOfPeriod === undefined ? undefined : formData?.endOfPeriod,
      year: formData?.year === undefined ? undefined : String(formData?.year),
    });
    // formData needed otherwise localstorage data is not loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, formData]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const handleClick = () => {
    if (formData?.year) {
      setValue(
        "endOfPeriod",
        formatISO(endOfYear(new Date().setFullYear(formData?.year)), { representation: "date" }),
        { shouldDirty: true, shouldValidate: true },
      );
    }
  };

  const onSubmit = async ({ endOfPeriod }: FormType) => {
    saveFormData({ endOfPeriod });
    router.push("/ecart-rep/ecart-representation");
  };

  return (
    <>
      <h1>{title}</h1>

      <ClientAuthenticatedOnly>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormLayout>
            <FormGroup>
              <FormGroupLabel htmlFor="year">
                Année au titre de laquelle les écarts de représentation sont calculés.
              </FormGroupLabel>
              <FormInput
                id="year"
                type="text"
                {...register("year")}
                isError={Boolean(errors.year)}
                readOnly
                aria-describedby="year-message-error-msg"
              />
              {errors.year && <FormGroupMessage id="year-message-error">{errors.year.message}</FormGroupMessage>}
            </FormGroup>
            <FormGroup>
              <FormGroupLabel htmlFor="endOfPeriod">
                Date de fin de la période de douze mois consécutifs correspondant à l'exercice comptable pour le calcul
                des écarts
              </FormGroupLabel>
              <FormInput
                id="endOfPeriod"
                type="date"
                {...register("endOfPeriod")}
                isError={Boolean(errors.endOfPeriod)}
                placeholder="Sélectionner une date"
                aria-describedby="endOfPeriod-message-error"
              />
              {errors.endOfPeriod && (
                <FormGroupMessage id="endOfPeriod-message-error">{errors.endOfPeriod.message}</FormGroupMessage>
              )}
              <br />
              <FormButton type="button" onClick={handleClick}>
                Sélectionner la fin de l'année civile
              </FormButton>
            </FormGroup>
            <FormLayoutButtonGroup>
              <Link href="entreprise" passHref>
                <ButtonAsLink size="sm" variant="secondary">
                  Précédent
                </ButtonAsLink>
              </Link>
              <FormButton type="submit" isDisabled={!isValid || (isSubmitted && !isDirty)}>
                Suivant
              </FormButton>
            </FormLayoutButtonGroup>
          </FormLayout>
        </form>
      </ClientAuthenticatedOnly>
    </>
  );
};

PeriodeReference.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout>{children}</RepartitionEquilibreeLayout>;
};

export default PeriodeReference;
