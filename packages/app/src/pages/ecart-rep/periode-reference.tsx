import { zodResolver } from "@hookform/resolvers/zod";
import { formatISO, getYear, parse, parseISO } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import type { MouseEvent } from "react";
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

const dateFormat = "YYYY-MM-DD";

const dateValidationError =
  "La date de fin de période de référence doit correspondre à l'année au titre de laquelle les écarts de représentation sont calculés";

const formSchema = z
  .object({
    year: z.number().min(4, "L'année est requise."),
    endOfPeriod: z.preprocess(arg => {
      if (typeof arg == "string" || arg instanceof Date) return formatISO(new Date(arg));
    }, z.string()),
  })
  .refine(
    async ({ year, endOfPeriod }) => {
      if (!year || !endOfPeriod) return false;
      const yearToBeChecked = getYear(parseISO(endOfPeriod));
      return year === yearToBeChecked;
    },
    {
      message: dateValidationError,
    },
  );

const PeriodeReference: NextPageWithLayout = () => {
  // const { isAuthenticated } = useUser();
  const router = useRouter();
  const { formData, saveFormData } = useFormManager();

  const { year } = formData;
  // useEffect(() => {
  //   if (!isAuthenticated) router.push("/ecart-rep/email");
  // }, [isAuthenticated, router]);

  type FormType = z.infer<typeof formSchema>;

  const {
    formState: { errors, isDirty, isValid },
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
    // watch,
  } = useForm<FormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      year: 0,
      endOfPeriod: undefined,
    },
  });

  // const endOfPeriod = watch("endOfPeriod");

  const resetAsyncForm = useCallback(async () => {
    reset({ endOfPeriod: formData?.endOfPeriod, year: formData?.year });
  }, [reset, formData]);

  useEffect(() => {
    resetAsyncForm();
  }, [resetAsyncForm]);

  const handleClick = (_event: MouseEvent) => () => {
    const currentYear = getYear(new Date());
    const endOfYear = formatISO(parse(`${currentYear}-12-31`, dateFormat, new Date()));
    setValue("endOfPeriod", endOfYear);
  };

  const onSubmit = async ({ year, endOfPeriod }: FormType) => {
    saveFormData({ year: year, endOfPeriod: endOfPeriod });
    router.push("/ecart-rapartition");
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
            <FormButton onClick={handleClick}>Sélectionner la fin de l'année civile</FormButton>
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
