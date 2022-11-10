import { zodResolver } from "@hookform/resolvers/zod";
import { endOfYear, formatISO, getYear } from "date-fns";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { NextPageWithLayout } from "../_app";
import { zodDateSchema } from "@common/utils/form";
import { RepresentationEquilibreeLayout } from "@components/layouts/RepresentationEquilibreeLayout";
import {
  ButtonAsLink,
  FormButton,
  FormGroup,
  FormGroupLabel,
  FormGroupMessage,
  FormInput,
  FormLayout,
  FormLayoutButtonGroup,
} from "@design-system";
import { useFormManager } from "@services/apiClient";

const formSchema = z
  .object({
    year: z.string().min(1, "L'année est requise."),
    endOfPeriod: zodDateSchema,
  })
  .superRefine(({ year, endOfPeriod }, ctx) => {
    if (getYear(new Date(endOfPeriod)) !== Number(year)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "La date de fin de la période de référence doit correspondre à l'année au titre de laquelle les écarts de représentation sont calculés",
        path: ["endOfPeriod"],
      });
    }
  });

type FormType = z.infer<typeof formSchema>;

const PeriodeReference: NextPageWithLayout = () => {
  const router = useRouter();
  const { formData, saveFormData } = useFormManager();

  const {
    formState: { errors, isValid },
    handleSubmit,
    register,
    setValue,
  } = useForm<FormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      endOfPeriod: formData?.endOfPeriod === undefined ? undefined : formData?.endOfPeriod,
      year: formData?.year === undefined ? undefined : String(formData?.year),
    },
  });

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
    router.push("/representation-equilibree/ecarts-cadres");
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormLayout>
          <FormGroup>
            <FormGroupLabel htmlFor="year">
              Année au titre de laquelle les écarts de représentation sont calculés
            </FormGroupLabel>
            <FormInput
              id="year"
              type="text"
              {...register("year")}
              isError={Boolean(errors.year)}
              readOnly
              aria-describedby={errors.year && "year-message-error-msg"}
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
              aria-describedby={errors.endOfPeriod && "endOfPeriod-message-error"}
            />
            {errors.endOfPeriod && (
              <FormGroupMessage id="endOfPeriod-message-error">{errors.endOfPeriod.message}</FormGroupMessage>
            )}
            <br />
            <FormButton type="button" variant="secondary" size="sm" onClick={handleClick}>
              Sélectionner la fin de l'année civile
            </FormButton>
          </FormGroup>
          <FormLayoutButtonGroup>
            <NextLink href="entreprise" passHref>
              <ButtonAsLink size="sm" variant="secondary">
                Précédent
              </ButtonAsLink>
            </NextLink>
            <FormButton isDisabled={!isValid}>Suivant</FormButton>
          </FormLayoutButtonGroup>
        </FormLayout>
      </form>
    </>
  );
};

PeriodeReference.getLayout = ({ children }) => {
  return <RepresentationEquilibreeLayout title="Période de référence">{children}</RepresentationEquilibreeLayout>;
};

export default PeriodeReference;
