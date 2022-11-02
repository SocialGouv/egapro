import { useAutoAnimate } from "@formkit/auto-animate/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError } from "next/dist/server/api-utils";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { NextPageWithLayout } from "../_app";
import { AuthenticatedOnly } from "@components/AuthenticatedOnly";
import { ClientOnly } from "@components/ClientOnly";
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
  AlertTitle,
} from "@design-system";
import {
  checkSiren,
  fetchRepartitionEquilibree,
  fetchSiren,
  ownersForSiren,
  useFormManager,
  useUser,
} from "@services/apiClient";

const OWNER_ERROR = "Erreur : vous n'avez pas les droits sur ce Siren";

const formSchema = z
  .object({
    year: z.string().min(1, "L'année est requise."), // No control needed because this is a select with options we provide.
    siren: z
      .string()
      .min(1, { message: "Le Siren est requis" })
      .regex(/^[0-9]{9}$/, "Le Siren est formé de 9 chiffres."),
  })
  .superRefine(async ({ year, siren }, ctx) => {
    if (siren && siren.length === 9) {
      try {
        await checkSiren(siren, Number(year));
      } catch (error: unknown) {
        console.error("error", error);
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: error instanceof Error ? error.message : "Le Siren est invalide.",
          path: ["siren"],
        });
        return z.NEVER; // Abort early when there is an error in the first API call.
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
    }
  });

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

const buildConfirmMessage = (siren: string) =>
  `Vous avez commencé une déclaration avec le Siren ${siren}. Voulez-vous commencer une nouvelle déclaration et supprimer les données déjà enregistrées ?`;

const CommencerPage: NextPageWithLayout = () => {
  useUser({ redirectTo: "/ecart-rep/email", checkTokenInURL: true });
  const router = useRouter();
  const { formData, saveFormData, resetFormData } = useFormManager();
  const [animationParent] = useAutoAnimate<HTMLDivElement>();
  const [isAlreadyPresent, setAlreadyPresent] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitted, isValid, isSubmitting },
  } = useForm<FormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema), // Configuration the validation with the zod schema.
    defaultValues: {
      siren: formData?.entreprise?.siren,
      year: formData?.year === undefined ? "" : String(formData?.year),
    },
  });

  const siren = watch("siren");

  useEffect(() => {
    // Clean errors on Siren change.
    setAlreadyPresent(false);
    setGlobalError("");
  }, [siren]);

  const onSubmit = async ({ year, siren }: FormType) => {
    const startFresh = async () => {
      try {
        const entreprise = await fetchSiren(siren, Number(year));
        saveFormData({ entreprise, year: Number(year) });
        router.push("/ecart-rep/declarant");
      } catch (error) {
        console.error("erreur dans fetchSiren");
      }
    };

    try {
      const repeq = await fetchRepartitionEquilibree(siren, Number(year));
      if (repeq) {
        setAlreadyPresent(true);
        return;
      }
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        // We can safely ignore this error, because this is the normal case.
      } else {
        // We can't continue in this case, because the backend is not ready.
        console.error("Unexpected API error", error);
        setGlobalError("Le service est indisponible pour l'instant. Veuillez réessayer plus tard.");
        return;
      }
    }

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
    <ClientOnly>
      <p>
        <b>
          Si vous souhaitez visualiser ou modifier une déclaration déjà transmise, veuillez saisir les informations
          correspondantes à la déclaration.
        </b>
      </p>

      <div ref={animationParent}>
        {globalError && (
          <Alert type="error" size="sm" mb="4w">
            <p>{globalError}</p>
          </Alert>
        )}
        {isAlreadyPresent && (
          <Alert type="error" size="sm" mb="4w">
            <p>Erreur&nbsp;: une déclaration pour ce Siren a déjà été validée et transmise.</p>
          </Alert>
        )}
        {errors.siren && errors.siren.message === OWNER_ERROR && (
          <Alert type="error" mb="4w">
            <AlertTitle>Erreur</AlertTitle>
            <MailtoLinkForNonOwner />
          </Alert>
        )}
      </div>

      <AuthenticatedOnly>
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
                aria-describedby={errors.year && "year-message-error"}
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
                placeholder="Ex: 504920166, 403461742, 403696735"
                type="text"
                {...register("siren")}
                isError={Boolean(errors.siren)}
                aria-describedby={errors.siren && "siren-message-error"}
                maxLength={9}
              />
              {errors.siren && errors.siren.message !== OWNER_ERROR && (
                <FormGroupMessage id="siren-message-error">{errors.siren.message}</FormGroupMessage>
              )}
            </FormGroup>
            <FormLayoutButtonGroup>
              <FormButton isDisabled={!isValid}>Suivant</FormButton>
            </FormLayoutButtonGroup>
          </FormLayout>
        </form>
      </AuthenticatedOnly>
    </ClientOnly>
  );
};

CommencerPage.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout>{children}</RepartitionEquilibreeLayout>;
};

export default CommencerPage;
