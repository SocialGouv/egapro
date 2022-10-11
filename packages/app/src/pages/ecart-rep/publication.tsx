import { zodResolver } from "@hookform/resolvers/zod";
import { isValid, parseISO } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useFormManager } from "../../services/apiClient/form-manager";
import type { NextPageWithLayout } from "../_app";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";
import {
  Alert,
  AlertTitle,
  ButtonAsLink,
  FormButton,
  FormGroup,
  FormGroupLabel,
  FormInput,
  FormLayout,
  FormLayoutButtonGroup,
  FormRadioGroup,
  FormRadioGroupContent,
  FormRadioGroupInput,
  FormRadioGroupLegend,
  FormTextarea,
} from "@design-system";

const title = "Publication";

const formSchema = z.object({
  publishingContent: z.string(),
  publishingDate: z.string().refine(val => isValid(val) || isValid(parseISO(val)), {
    message: "La date de publication des écart calculables est de la forme jj/mm/aaaa.",
  }),
  publishingWebsiteUrl: z.string().url(),
});

type FormType = z.infer<typeof formSchema>;

const strRadioToBool = (radioInput: string): boolean => {
  if (radioInput === "true") return true;
  return false;
};

const Publication: NextPageWithLayout = () => {
  const [hasWebsite, setHasWebsite] = useState<boolean>(true);
  const router = useRouter();
  const { formData, saveFormData } = useFormManager();
  const {
    formState: { errors, isDirty, isValid, isSubmitted },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<FormType>({
    resolver: zodResolver(formSchema),
  });

  const resetAsyncForm = useCallback(async () => {
    reset({
      publishingContent: formData?.publishingContent,
      publishingDate: formData?.publishingDate === undefined ? undefined : formData?.publishingDate,
      publishingWebsiteUrl: formData?.publishingWebsiteUrl,
    });
  }, [reset, formData]);

  useEffect(() => {
    resetAsyncForm();
  }, [resetAsyncForm]);

  function handleHasWebsiteChange(e: React.ChangeEvent<HTMLInputElement>) {
    setHasWebsite(strRadioToBool(e.target.value));
  }

  const onSubmit = async ({ publishingDate, publishingWebsiteUrl }: FormType) => {
    saveFormData({ publishingDate, publishingWebsiteUrl });
    router.push("/ecart-rep/recapitulatif");
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
          </FormGroup>
          <FormRadioGroup inline>
            <FormRadioGroupLegend id="hasWebsite">
              Avez-vous un site Internet pour publier les écarts calculables&nbsp;?
            </FormRadioGroupLegend>
            <FormRadioGroupContent>
              <FormRadioGroupInput
                id="yes"
                name="hasWebsite"
                checked={hasWebsite}
                value="true"
                onChange={handleHasWebsiteChange}
              >
                Oui
              </FormRadioGroupInput>
              <FormRadioGroupInput
                id="no"
                name="hasWebsite"
                checked={!hasWebsite}
                value="false"
                onChange={handleHasWebsiteChange}
              >
                Non
              </FormRadioGroupInput>
            </FormRadioGroupContent>
          </FormRadioGroup>

          {hasWebsite ? (
            <FormGroup>
              <FormGroupLabel htmlFor="publishingWebsiteUrl">
                Indiquer l'adresse exacte de la page Internet (URL) sur laquelle seront publiés les écarts calculables
              </FormGroupLabel>
              <FormInput id="publishingWebsiteUrl" placeholder="https://" />
            </FormGroup>
          ) : (
            <FormGroup>
              <FormGroupLabel htmlFor="publishingContent">
                Préciser les modalités de communication des écarts calculables auprès de vos salariés
              </FormGroupLabel>
              <FormTextarea id="publishingContent" />
            </FormGroup>
          )}

          <FormLayoutButtonGroup>
            {/* TODO: add real path */}
            <Link href="/" passHref>
              <ButtonAsLink variant="secondary">Précédent</ButtonAsLink>
            </Link>
            <FormButton isDisabled>Suivant</FormButton>
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
