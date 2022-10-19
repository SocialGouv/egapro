import { zodResolver } from "@hookform/resolvers/zod";
import { isValid, parseISO } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { NextPageWithLayout } from "../_app";
import { strRadioToBool } from "@common/utils/form";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";
import {
  Alert,
  AlertTitle,
  ButtonAsLink,
  FormButton,
  FormGroup,
  FormGroupLabel,
  FormGroupMessage,
  FormInput,
  FormLayout,
  FormLayoutButtonGroup,
  FormRadioGroup,
  FormRadioGroupContent,
  FormRadioGroupInput,
  FormRadioGroupLegend,
  FormTextarea,
} from "@design-system";
import { useFormManager } from "@services/apiClient";

const title = "Publication";

const formSchema = z
  .object({
    hasWebsite: z.union([z.literal("oui"), z.literal("non")]),
    publishingContent: z.string().trim().optional(),
    publishingDate: z.string().refine(val => isValid(val) || isValid(parseISO(val)), {
      message: "La date de publication des écart calculables est de la forme jj/mm/aaaa.",
    }),
    publishingWebsiteUrl: z.string().trim().optional(),
  })
  .superRefine(({ hasWebsite, publishingContent, publishingWebsiteUrl }, ctx) => {
    if (hasWebsite === "oui" && !publishingWebsiteUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'adresse exacte de la page internet est obligatoire",
        path: ["publishingWebsiteUrl"],
      });
    }
    if (hasWebsite === "non" && !publishingContent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La description des modalités de communication des écarts est obligatoire",
        path: ["publishingContent"],
      });
    }
  });

type FormType = z.infer<typeof formSchema>;

const Publication: NextPageWithLayout = () => {
  const router = useRouter();
  const { formData, saveFormData } = useFormManager();
  const {
    formState: { errors, isDirty, isValid, isSubmitted },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<FormType>({
    mode: "onBlur",
    resolver: zodResolver(formSchema),
  });

  const hasWebsite = watch("hasWebsite");

  const resetForm = useCallback(() => {
    if (formData) {
      reset({
        hasWebsite: formData?.hasWebsite ? "oui" : "non",
        publishingContent: formData?.publishingContent,
        publishingDate: formData?.publishingDate === undefined ? undefined : formData?.publishingDate,
        publishingWebsiteUrl: formData?.publishingWebsiteUrl,
      });
    }
  }, [reset, formData]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const onSubmit = async ({ hasWebsite, publishingContent, publishingDate, publishingWebsiteUrl }: FormType) => {
    saveFormData({
      hasWebsite: strRadioToBool(hasWebsite),
      publishingContent,
      publishingDate,
      publishingWebsiteUrl,
    });
    router.push("/ecart-rep/validation");
  };

  return (
    <>
      <h1>{title}</h1>
      <Alert mb="4w">
        <AlertTitle as="h2">Obligation de transparence</AlertTitle>
        <p>
          Les entreprises doivent publier chaque année, <strong>au plus tard le 1er mars</strong>, leurs écarts
          éventuels de représentation femmes-hommes pour les cadres dirigeants et au sein des instances dirigeantes de
          manière visible et lisible sur leur site internet, et les laisser en ligne jusqu’à la publication de leurs
          écarts l’année suivante. Si l’entreprise ne dispose pas de site internet, elle doit porter ces informations à
          la connaissance des salariés par tout moyen.
        </p>
      </Alert>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormLayout>
          <FormGroup>
            <FormGroupLabel htmlFor="publishingDate">Date de publication des écarts calculables</FormGroupLabel>
            <FormInput id="publishingDate" type="date" {...register("publishingDate")} />
            {errors.publishingDate && (
              <FormGroupMessage id="publishingDate-message-error">{errors.publishingDate.message}</FormGroupMessage>
            )}
          </FormGroup>
          <FormRadioGroup inline>
            <FormRadioGroupLegend id="hasWebsite">
              Avez-vous un site Internet pour publier les écarts calculables&nbsp;?
            </FormRadioGroupLegend>
            <FormRadioGroupContent>
              <FormRadioGroupInput {...register("hasWebsite")} id="oui" name="hasWebsite" value="oui">
                Oui
              </FormRadioGroupInput>
              <FormRadioGroupInput {...register("hasWebsite")} id="non" name="hasWebsite" value="non">
                Non
              </FormRadioGroupInput>
            </FormRadioGroupContent>
          </FormRadioGroup>
          {hasWebsite === "oui" ? (
            <FormGroup>
              <FormGroupLabel htmlFor="publishingWebsiteUrl">
                Indiquer l'adresse exacte de la page Internet (URL) sur laquelle seront publiés les écarts calculables
              </FormGroupLabel>
              <FormInput
                id="publishingWebsiteUrl"
                placeholder="https://"
                {...register("publishingWebsiteUrl")}
                aria-describedby="publishingWebsiteUrl-message-error"
              />
              {errors.publishingWebsiteUrl && (
                <FormGroupMessage id="publishingWebsiteUrl-message-error">
                  {errors.publishingWebsiteUrl.message}
                </FormGroupMessage>
              )}
            </FormGroup>
          ) : (
            <FormGroup>
              <FormGroupLabel htmlFor="publishingContent">
                Préciser les modalités de communication des écarts calculables auprès de vos salariés
              </FormGroupLabel>
              <FormTextarea
                id="publishingContent"
                {...register("publishingContent")}
                aria-describedby="publishingContent-message-error"
              />
              {errors.publishingContent && (
                <FormGroupMessage id="publishingContent-message-error">
                  {errors.publishingContent.message}
                </FormGroupMessage>
              )}
            </FormGroup>
          )}
          <FormLayoutButtonGroup>
            <Link href="/ecart-rep/ecarts-membres" passHref>
              <ButtonAsLink variant="secondary">Précédent</ButtonAsLink>
            </Link>
            <FormButton isDisabled={!isValid || (isSubmitted && !isDirty)}>Suivant</FormButton>
          </FormLayoutButtonGroup>
        </FormLayout>
      </form>
    </>
  );
};

Publication.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout>{children}</RepartitionEquilibreeLayout>;
};

export default Publication;
