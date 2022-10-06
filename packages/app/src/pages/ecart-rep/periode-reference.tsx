import { zodResolver } from "@hookform/resolvers/zod";
import getYear from "date-fns/getYear";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useFormManager } from "../../services/apiClient/form-manager";
import type { NextPageWithLayout } from "../_app";
import type { FeatureStatus } from "@common/utils/feature";
import { useUser } from "@components/AuthContext";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";
import { FormGroup, FormGroupMessage, FormGroupLabel, FormInput, FormButton } from "@design-system";

const title = "Période de référence";

const dateValidationError =
  "La date de fin de période de référence doit correspondre à l'année au titre de laquelle les écarts de représentation sont calculés";

const PeriodeReference: NextPageWithLayout = () => {
  const { isAuthenticated } = useUser();
  const router = useRouter();
  const { formData, saveFormData } = useFormManager();
  const [featureStatus, setFeatureStatus] = useState<FeatureStatus>({ type: "idle" });

  useEffect(() => {
    if (!isAuthenticated) router.push("/ecart-rep/email");
  }, [isAuthenticated, router]);

  const formSchema = useMemo(
    () =>
      z
        .object({
          year: z.string().min(4, "L'année est requise."),
          endOfPeriod: z.instanceof(Date, { message: "La date de fin de période de référence." }),
        })
        .refine(async ({ year, endOfPeriod }) => {
          if (!year || !endOfPeriod) return false;
          const yearToBeChecked = getYear(endOfPeriod);
          // console.log(yearToBeChecked);
          return (
            yearToBeChecked === formData?.year,
            {
              message: dateValidationError,
            }
          );
        }),
    [formData],
  );

  type FormType = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
  } = useForm<FormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      year: "",
      endOfPeriod: undefined,
    },
  });

  const onSubmit = async ({ year, endOfPeriod }: FormType) => {
    setFeatureStatus({ type: "loading" });
    console.log("submit", year, endOfPeriod);
    setFeatureStatus({ type: "idle" });
  };

  return (
    <>
      <h1>{title}</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormGroup>
          <FormGroupLabel htmlFor="year">
            Année au titre de laquelle les écarts de représentation sont calculés.
          </FormGroupLabel>
          <FormInput
            id="year"
            {...register("year")}
            isError={Boolean(errors.year)}
            aria-describedby="year-message-error-msg"
            value={formData ? formData.year : ""}
            readOnly
          />
          {errors.year && <FormGroupMessage id="year-message-error">{errors.year.message}</FormGroupMessage>}
        </FormGroup>
        <FormGroup>
          <FormGroupLabel htmlFor="endOfPeriod">
            Date de fin de la période de douze mois consécutifs correspondant à l'exercice comptable pour le calcul des
            écarts
          </FormGroupLabel>
          <FormInput
            id="endOfPeriod"
            placeholder="Sélectionner une date"
            type="date"
            {...register("endOfPeriod")}
            isError={Boolean(errors.endOfPeriod)}
          />
          {errors.endOfPeriod && (
            <FormGroupMessage id="endOfPeriod-message">{errors.endOfPeriod.message}</FormGroupMessage>
          )}
        </FormGroup>
        <FormButton isDisabled={!isValid || isDirty}>Suivant</FormButton>
      </form>
    </>
  );
};

PeriodeReference.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout>{children}</RepartitionEquilibreeLayout>;
};

export default PeriodeReference;
