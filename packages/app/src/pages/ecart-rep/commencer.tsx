import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useFormManager } from "../../services/apiClient/form-manager";
import { checkSiren, fetchSiren } from "../../services/apiClient/siren";
import type { NextPageWithLayout } from "../_app";
import type { FeatureStatus } from "@common/utils/feature";
import { useUser } from "@components/AuthContext";
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
} from "@design-system";

const title = "Commencer ou accéder à une déclaration";

const formSchema = z
  .object({
    year: z.string().min(1, "L'année est requise."), // No control needed because this is a select with options we provide.
    // siren: z.string().min(9, SIZE_SIREN_ERROR).max(9, SIZE_SIREN_ERROR),
    siren: z.string().regex(/^[0-9]{9}$/, "Le Siren est invalide."),
  })
  .refine(async ({ year, siren }) => {
    if (!year || !siren) return false;
    try {
      await checkSiren(siren, Number(year));
      return true;
    } catch (error) {
      console.error("error", error);
      return false;
    }
  });

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

const buildConfirmMessage = (siren: string) =>
  `Vous avez commencé une déclaration avec le Siren ${siren}. Voulez-vous commencer une nouvelle déclaration et supprimer les données déjà enregistrées ?`;

const CommencerPage: NextPageWithLayout = () => {
  const { isAuthenticated } = useUser();
  const router = useRouter();
  const { formData, saveFormData, resetFormData } = useFormManager();

  const [featureStatus, setFeatureStatus] = useState<FeatureStatus>({ type: "idle" });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitted, isValid },
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

  useEffect(() => {
    if (!isAuthenticated) router.push("/ecart-rep/email");
  }, [isAuthenticated, router]);

  const onSubmit = async ({ year, siren }: FormType) => {
    const startFresh = async () => {
      setFeatureStatus({ type: "loading" });

      try {
        const entreprise = await fetchSiren(siren, Number(year));
        resetFormData();
        saveFormData({ entreprise, year: Number(year) });
        setFeatureStatus({ type: "idle" });
        router.push("/ecart-rep/declarant");
      } catch (error) {
        console.error("erreur dans fetchSiren");
        setFeatureStatus({ type: "error", message: "Erreur dans fetchSiren" });
      }
    };

    if (formData.entreprise?.siren && siren !== formData.entreprise.siren) {
      if (confirm(buildConfirmMessage(formData.entreprise.siren))) {
        // Start a new declaration of repartition.
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
              placeholder="Ex: 504920166, 403461742"
              type="text"
              {...register("siren")}
              isError={Boolean(errors.siren)}
              aria-describedby="siren-message-error"
              maxLength={9}
            />
            {errors.siren && <FormGroupMessage id="siren-message-error">{errors.siren.message}</FormGroupMessage>}
          </FormGroup>
          <FormLayoutButtonGroup>
            {/* <FormButton isDisabled={(isSubmitted && !isValid) || !isDirty || featureStatus.type === "loading"}> */}
            <FormButton isDisabled={(isSubmitted && !isValid) || featureStatus.type === "loading"}>Suivant</FormButton>
          </FormLayoutButtonGroup>
        </FormLayout>
      </form>
    </>
  );
};

CommencerPage.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout>{children}</RepartitionEquilibreeLayout>;
};

export default CommencerPage;
