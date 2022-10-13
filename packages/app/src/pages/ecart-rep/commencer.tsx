import { useAutoAnimate } from "@formkit/auto-animate/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import React, { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useCheckTokenInURL } from "../../hooks/useCheckTokenInURL";
import { useFormManager } from "../../hooks/useFormManager";
import { useUser } from "../../hooks/useUser";
import { checkSiren, fetchSiren, ownersForSiren } from "../../services/apiClient/siren";
import type { NextPageWithLayout } from "../_app";
import { ClientAuthenticatedOnly } from "@components/ClientAuthenticatedOnly";
import { MailtoLinkForNonOwner } from "@components/MailtoLink";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";
import {
  FormButton,
  FormGroup,
  FormGroupMessage,
  FormInput,
  FormGroupLabel,
  FormSelect,
  FormLayout,
  FormLayoutButtonGroup,
  Alert,
} from "@design-system";

const title = "Commencer ou accéder à une déclaration";

const OWNER_ERROR = "Vous n'avez pas les droits sur ce Siren";

const formSchema = z
  .object({
    year: z.string().min(1, "L'année est requise."), // No control needed because this is a select with options we provide.
    siren: z.string().regex(/^[0-9]{9}$/, "Le Siren est invalide."),
  })
  .superRefine(async ({ year, siren }, ctx) => {
    if (!year || !siren) return false;
    try {
      await checkSiren(siren, Number(year));
    } catch (error: unknown) {
      console.error("error", error);
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : "Le n° Siren est invalide",
        path: ["siren"],
      });
    }
    try {
      await ownersForSiren(siren);
    } catch (error: unknown) {
      console.error("error", error);
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: OWNER_ERROR,
        path: ["siren"],
      });
    }
  });

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

const buildConfirmMessage = (siren: string) =>
  `Vous avez commencé une déclaration avec le Siren ${siren}. Voulez-vous commencer une nouvelle déclaration et supprimer les données déjà enregistrées ?`;

const CommencerPage: NextPageWithLayout = () => {
  useCheckTokenInURL();
  useUser({ redirectTo: "/ecart-rep/email" });
  const router = useRouter();
  const { formData, updateFormData, resetFormData } = useFormManager();
  const [animationParent] = useAutoAnimate<HTMLDivElement>();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitted, isValid, isSubmitting },
  } = useForm<FormType>({
    resolver: zodResolver(formSchema), // Configuration the validation with the zod schema.
  });

  const resetAsyncForm = useCallback(async () => {
    reset({
      siren: formData?.entreprise?.siren,
      year: formData?.year === undefined ? undefined : String(formData?.year),
    });
  }, [reset, formData]);

  useEffect(() => {
    resetAsyncForm();
  }, [resetAsyncForm]);

  const onSubmit = async ({ year, siren }: FormType) => {
    const startFresh = async () => {
      try {
        const entreprise = await fetchSiren(siren, Number(year));
        updateFormData({ entreprise, year: Number(year) });
        router.push("/ecart-rep/declarant");
      } catch (error) {
        console.error("erreur dans fetchSiren");
      }
    };

    if (formData.entreprise?.siren && siren !== formData.entreprise.siren) {
      if (confirm(buildConfirmMessage(formData.entreprise.siren))) {
        // Start a new declaration of repartition.
        resetFormData();
        await startFresh();
      } else {
        // Rollback.
        setValue("siren", formData.entreprise.siren);
        return;
      }
    } else {
      await startFresh();
    }
  };

  return (
    <>
      <h1>{title}</h1>

      <p>
        Si vous souhaitez visualiser ou modifier une déclaration déjà transmise, veuillez saisir les informations
        correspondantes à la déclaration.
      </p>

      <div ref={animationParent} style={{ marginBottom: 20 }}>
        {errors.siren && errors.siren.message === OWNER_ERROR && (
          <Alert type="error">
            <MailtoLinkForNonOwner />
          </Alert>
        )}
      </div>

      <ClientAuthenticatedOnly>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormLayout>
            <FormGroup>
              <FormGroupLabel htmlFor="year">
                Année au titre de laquelle les écarts de représentation sont calculés
              </FormGroupLabel>
              <FormSelect
                id="year"
                placeholder="Sélectionnez une année"
                {...register("year")}
                isError={Boolean(errors.year)}
                aria-describedby="year-message-error"
              >
                <option value="2021">2021</option>
              </FormSelect>
              {errors.year && <FormGroupMessage id="year-message-error">{errors.year.message}</FormGroupMessage>}
            </FormGroup>
            <FormGroup>
              <FormGroupLabel htmlFor="siren" hint="9 chiffres">
                Numéro Siren de l'entreprise
              </FormGroupLabel>
              <FormInput
                id="siren"
                placeholder="Ex: 504920166, 403461742, 403696735, 888888997"
                type="text"
                {...register("siren")}
                isError={Boolean(errors.siren)}
                aria-describedby="siren-message-error"
                maxLength={9}
              />
              {errors.siren && errors.siren.message !== OWNER_ERROR && (
                <FormGroupMessage id="siren-message-error">{errors.siren.message}</FormGroupMessage>
              )}
            </FormGroup>
            <FormLayoutButtonGroup>
              <FormButton isDisabled={(isSubmitted && !isValid) || isSubmitting}>Suivant</FormButton>
            </FormLayoutButtonGroup>
          </FormLayout>
        </form>
      </ClientAuthenticatedOnly>
    </>
  );
};

CommencerPage.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout>{children}</RepartitionEquilibreeLayout>;
};

export default CommencerPage;
