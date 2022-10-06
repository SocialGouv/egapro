import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { FeatureStatus } from "@common/utils/feature";
import { useUser } from "@components/AuthContext";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";
import { FormButton, FormGroup, FormGroupMessage, FormInput, FormGroupLabel, FormSelect } from "@design-system";
import { useFormManager } from "services/apiClient/form-manager";
import { checkSirenWithOwner, fetchSiren } from "services/apiClient/siren";

const title = "Commencer ou accéder à une déclaration";

const formSchema = z
  .object({
    year: z.string().min(1, "L'année est requise."), // No control needed because this is a select with options we provide.
    // siren: z.string().min(9, SIZE_SIREN_ERROR).max(9, SIZE_SIREN_ERROR),
    siren: z.string().regex(/^[0-9]{9}$/, "Le Siren est invalide."),
  })
  .refine(async ({ year, siren }) => {
    console.log("dans refine", year, siren);
    if (!year || !siren) return false;
    try {
      await checkSirenWithOwner(siren, Number(year));
      return true;
    } catch (error) {
      console.error("errror", error);
      return false;
    }
  });

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

const buildConfirmMessage = (siren: string) =>
  `Vous avez commencé une déclaration avec le Siren ${siren}. Voulez-vous commencer une nouvelle déclaration et supprimer les données déjà enregistrées ?`;

export default function CommencerPage() {
  const { isAuthenticated } = useUser();
  const router = useRouter();
  const { formData, save } = useFormManager();

  const [featureStatus, setFeatureStatus] = React.useState<FeatureStatus>({ type: "idle" });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitted, isValid },
  } = useForm<FormType>({
    resolver: zodResolver(formSchema as any), // Configuration the validation with the zod schema.
  });

  const resetAsyncForm = React.useCallback(async () => {
    reset({ siren: formData?.entreprise?.siren, year: String(formData.year) });
  }, [reset, formData]);

  React.useEffect(() => {
    resetAsyncForm();
  }, [resetAsyncForm]);

  React.useEffect(() => {
    if (!isAuthenticated) router.push("/ecart-rep/email");
  }, [isAuthenticated, router]);

  const onSubmit = async ({ year, siren }: FormType) => {
    const startFresh = async () => {
      setFeatureStatus({ type: "loading" });

      const entreprise = await fetchSiren(siren, Number(year));

      save({ entreprise, year: Number(year) });

      setFeatureStatus({ type: "idle" });

      router.push("/ecart-rep/entreprise");
    };

    if (formData.entreprise?.siren && siren !== formData.entreprise.siren) {
      if (confirm(buildConfirmMessage(formData.entreprise.siren))) {
        // Start a new declaration of repartition.
        startFresh();
      } else {
        // Rollback.
        setValue("siren", formData.entreprise.siren);
        return;
      }
    }
    startFresh();
  };

  return (
    <>
      <h1>{title}</h1>

      <p>
        Si vous souhaitez visualiser ou modifier une déclaration déjà transmise, veuillez saisir les informations
        correspondantes à la déclaration.
      </p>

      <p>Année au titre de laquelle les écarts de représentation sont calculés.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormGroup>
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
            maxLength={9}
          />
          {errors.siren && <FormGroupMessage id="siren-message">{errors.siren.message}</FormGroupMessage>}
        </FormGroup>

        {/* <FormButton isDisabled={(isSubmitted && !isValid) || !isDirty || featureStatus.type === "loading"}> */}
        <FormButton isDisabled={(isSubmitted && !isValid) || featureStatus.type === "loading"}>Suivant</FormButton>
      </form>
    </>
  );
}

CommencerPage.getLayout = function getLayout(page: React.ReactElement) {
  return <RepartitionEquilibreeLayout>{page}</RepartitionEquilibreeLayout>;
};
