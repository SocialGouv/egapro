import { formatIsoToFr } from "@common/utils/date";
import { radioBoolToString, radioStringToBool, zodDateSchema, zodRadioInputSchema } from "@common/utils/form";
import { AlertEdition } from "@components/AlertEdition";
import { RepresentationEquilibreeLayout } from "@components/layouts/RepresentationEquilibreeLayout";
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
import { zodResolver } from "@hookform/resolvers/zod";
import type { FormState } from "@services/apiClient";
import { useFormManager } from "@services/apiClient";
import { isAfter, parseISO } from "date-fns";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { NextPageWithLayout } from "../_app";

const URL_REGEX = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/i;

const formSchemaBuilder = ({ endOfPeriod }: FormState) =>
  z
    .object({
      hasWebsite: zodRadioInputSchema,
      publishingContent: z.string().trim().optional(),
      publishingDate: zodDateSchema.refine(
        date => (endOfPeriod ? isAfter(parseISO(date), parseISO(endOfPeriod)) : true),
        {
          message: `La date de publication ne peut précéder la date de fin de la période de référence ${
            endOfPeriod ? "(" + formatIsoToFr(endOfPeriod) + ")" : ""
          }`,
        },
      ),
      publishingWebsiteUrl: z.string().trim().optional(),
    })
    .superRefine(({ hasWebsite, publishingContent, publishingWebsiteUrl }, ctx) => {
      if (hasWebsite === "oui") {
        if (!publishingWebsiteUrl) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "L'adresse exacte de la page internet est obligatoire",
            path: ["publishingWebsiteUrl"],
          });
        } else if (!new RegExp(URL_REGEX).test(publishingWebsiteUrl)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "L'adresse de la page internet est invalide",
            path: ["publishingWebsiteUrl"],
          });
        }
      }
      if (hasWebsite === "non" && !publishingContent) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La description des modalités de communication des écarts est obligatoire",
          path: ["publishingContent"],
        });
      }
    });

export type FormTypeInput = z.input<ReturnType<typeof formSchemaBuilder>>;
export type FormTypeOutput = z.infer<ReturnType<typeof formSchemaBuilder>>;

const Publication: NextPageWithLayout = () => {
  const router = useRouter();
  const { formData, saveFormData } = useFormManager();

  const {
    formState: { errors, isValid },
    handleSubmit,
    register,
    watch,
    trigger,
  } = useForm<FormTypeInput>({
    mode: "onChange",
    resolver: zodResolver(formSchemaBuilder(formData)),
    defaultValues: {
      hasWebsite: radioBoolToString(formData?.hasWebsite),
      publishingContent: formData?.publishingContent,
      publishingDate: formData?.publishingDate === undefined ? undefined : formData?.publishingDate,
      publishingWebsiteUrl: formData?.publishingWebsiteUrl,
    },
  });

  useEffect(() => {
    // We run the validation because we need to show an error if publication date is before end of period, at React hydration.
    // We use the fact that other infos are already present in formData, to differenciate whether this page has been previously filled or not.
    if (formData?.publishingContent || formData?.publishingWebsiteUrl) {
      trigger();
    }
  }, [formData?.publishingWebsiteUrl, formData?.publishingContent, trigger]);

  const hasWebsite = watch("hasWebsite");

  const onSubmit = async (data: FormTypeInput) => {
    const { hasWebsite, publishingContent, publishingDate, publishingWebsiteUrl } = data as FormTypeOutput;

    saveFormData({
      hasWebsite: radioStringToBool(hasWebsite),
      publishingContent,
      publishingDate,
      publishingWebsiteUrl,
    });
    router.push("/representation-equilibree/validation");
  };

  return (
    <>
      <AlertEdition />

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
                aria-describedby={errors.publishingWebsiteUrl && "publishingWebsiteUrl-message-error"}
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
                aria-describedby={errors.publishingContent && "publishingContent-message-error"}
              />
              {errors.publishingContent && (
                <FormGroupMessage id="publishingContent-message-error">
                  {errors.publishingContent.message}
                </FormGroupMessage>
              )}
            </FormGroup>
          )}
          <FormLayoutButtonGroup>
            <ButtonAsLink href="/representation-equilibree/ecarts-membres" variant="secondary">
              Précédent
            </ButtonAsLink>
            <FormButton isDisabled={!isValid}>Suivant</FormButton>
          </FormLayoutButtonGroup>
        </FormLayout>
      </form>
    </>
  );
};

Publication.getLayout = ({ children }) => {
  return <RepresentationEquilibreeLayout title="Publication">{children}</RepresentationEquilibreeLayout>;
};

export default Publication;
