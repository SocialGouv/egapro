import { zodResolver } from "@hookform/resolvers/zod";
import { endOfYear, format, formatISO, getYear, isValid, parseISO } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useFormManager } from "../../services/apiClient/form-manager";
import type { NextPageWithLayout } from "../_app";
// import { useUser } from "@components/AuthContext";
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

const dateValidationError =
  "La date de fin de période de référence doit correspondre à l'année au titre de laquelle les écarts de représentation sont calculés";

const inputDateFormat = "yyyy-MM-dd";
const formSchema = z
  .object({
    year: z.string().min(1, "L'année est requise."),
    endOfPeriod: z.string().refine(
      val => {
        return isValid(val) || isValid(parseISO(val));
      },
      { message: "La période est requise." },
    ),
  })
  .refine(
    ({ year, endOfPeriod }) => {
      if (!year || !endOfPeriod) return false;
      const endOfPeriodDateFormat: Date = new Date(endOfPeriod);
      const yearOfEndOfPeriod = getYear(endOfPeriodDateFormat);
      return yearOfEndOfPeriod === Number(year);
    },
    {
      message: dateValidationError,
    },
  );

type FormType = z.infer<typeof formSchema>;

const PeriodeReference: NextPageWithLayout = () => {
  // const { isAuthenticated } = useUser();
  const router = useRouter();
  const { formData, saveFormData } = useFormManager();
  // useEffect(() => {
  //   if (!isAuthenticated) router.push("/ecart-rep/email");
  // }, [isAuthenticated, router]);

  const {
    formState: { errors, isDirty, isValid },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<FormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
  });

  const resetAsyncForm = useCallback(async () => {
    reset({
      endOfPeriod:
        formData?.endOfPeriod === undefined ? undefined : format(parseISO(formData?.endOfPeriod), inputDateFormat),
      year: formData?.year === undefined ? undefined : String(formData?.year),
    });
  }, [reset, formData]);

  useEffect(() => {
    resetAsyncForm();
  }, [resetAsyncForm]);

  const handleClick = () => {
    const eoy = endOfYear(new Date());
    const eoyFormatted = format(eoy, inputDateFormat);
    setValue("endOfPeriod", eoyFormatted);
  };

  const onSubmit = async ({ endOfPeriod }: FormType) => {
    saveFormData({ endOfPeriod: formatISO(new Date(endOfPeriod)) });
    router.push("ecart-repartition");
  };

  return (
    <>
      <h1>{title}</h1>
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
            <FormButton onClick={() => handleClick()}>Sélectionner la fin de l'année civile</FormButton>
          </FormGroup>
          <FormLayoutButtonGroup>
            <Link href="entreprise" passHref>
              <ButtonAsLink size="sm">Précédent</ButtonAsLink>
            </Link>
            <FormButton type="submit" isDisabled={!isValid || !isDirty}>
              Suivant
            </FormButton>
          </FormLayoutButtonGroup>
        </FormLayout>
      </form>
    </>
  );
};

PeriodeReference.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout>{children}</RepartitionEquilibreeLayout>;
};

export default PeriodeReference;
