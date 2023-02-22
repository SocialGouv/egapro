import { YEARS_REPEQ } from "@common/dict";
import { zodSirenSchema } from "@common/utils/form";
import { AuthenticatedOnly } from "@components/AuthenticatedOnly";
import { AlertFeatureStatus, FeatureStatusProvider, useFeatureStatus } from "@components/FeatureStatusProvider";
import { RepresentationEquilibreeLayout } from "@components/layouts/RepresentationEquilibreeLayout";
import { MailtoLinkForNonOwner } from "@components/MailtoLink";
import {
  Alert,
  AlertTitle,
  FormButton,
  FormGroup,
  FormGroupLabel,
  FormGroupMessage,
  FormInput,
  FormLayout,
  FormLayoutButtonGroup,
  FormSelect,
} from "@design-system";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  checkSiren,
  fetchRepresentationEquilibreeAsFormState,
  fetchSiren,
  ownersForSiren,
  useFormManager,
  useUser,
} from "@services/apiClient";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { NextPageWithLayout } from "../_app";

const OWNER_ERROR = "Erreur : vous n'avez pas les droits sur ce Siren";

const formSchema = z
  .object({
    year: z.string().min(1, "L'année est requise."), // No control needed because this is a select with options we provide.
    siren: zodSirenSchema,
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
  useUser();
  const router = useRouter();
  const { formData, saveFormData, resetFormData } = useFormManager();
  const [animationParent] = useAutoAnimate<HTMLDivElement>();
  const { setFeatureStatus } = useFeatureStatus({ reset: true });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
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
    setFeatureStatus({ type: "idle" });
  }, [siren, setFeatureStatus]);

  const saveAndGoNext = async (siren: string, year: number) => {
    try {
      // Synchronise with potential data in DB.
      const formState = await fetchRepresentationEquilibreeAsFormState(siren, year);

      if (formState) {
        saveFormData({ ...formState, status: "edition" });
        router.push(`/representation-equilibree/${siren}/${year}`);
        return;
      }
      // Otherwise, this is a creation, so we begin with fetching firm's data.
      const entreprise = await fetchSiren(siren, Number(year));
      saveFormData({ entreprise, year: Number(year), status: "creation" });
      router.push("/representation-equilibree/declarant");
    } catch (error) {
      // We can't continue in this case, because the backend is not ready.
      console.error("Unexpected API error", error);
      setFeatureStatus({
        type: "error",
        message: "Le service est indisponible pour l'instant. Veuillez réessayer plus tard.",
      });
    }
  };

  const onSubmit = async ({ year, siren }: FormType) => {
    // If no data are present in session storage.
    if (!formData.entreprise?.siren) {
      await saveAndGoNext(siren, Number(year));
      return;
    }
    // If data are present in session storage and Siren has not been changed.
    if (siren === formData.entreprise.siren) {
      router.push(
        formData.status === "edition"
          ? `/representation-equilibree/${siren}/${year}`
          : "/representation-equilibree/declarant",
      );
      return;
    }
    // If Siren has been changed, we ask the user if the user really want to erase the data.
    if (confirm(buildConfirmMessage(formData.entreprise.siren))) {
      // Start a new declaration of representation.
      resetFormData();
      await saveAndGoNext(siren, Number(year));
      return;
    } else {
      // Rollback to the old Siren.
      setValue("siren", formData.entreprise.siren);
      return;
    }
  };

  const confirmResetFormData = () => {
    if (confirm("Les données ne sont pas sauvegardées, êtes-vous sûr de vouloir réinitialiser le formulaire ?")) {
      resetFormData();
      setValue("siren", "");
      setValue("year", "");
    }
  };

  return (
    <AuthenticatedOnly>
      <p>
        <b>
          Si vous souhaitez visualiser ou modifier une déclaration déjà transmise, veuillez saisir les informations
          correspondantes à la déclaration.
        </b>
      </p>

      <AlertFeatureStatus type="error" title="Erreur" />

      <div ref={animationParent}>
        {errors.siren && errors.siren.message === OWNER_ERROR && (
          <Alert type="error" mb="4w">
            <AlertTitle>Erreur</AlertTitle>
            <MailtoLinkForNonOwner />
          </Alert>
        )}
      </div>

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
              {YEARS_REPEQ.sort()
                .reverse()
                .map(year => (
                  <option value={year} key={`year-select-${year}`}>
                    {year}
                  </option>
                ))}
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
            <FormButton
              type="button"
              variant="secondary"
              onClick={confirmResetFormData}
              disabled={!formData?.entreprise?.siren}
            >
              Réinitialiser
            </FormButton>
            <FormButton isDisabled={!isValid}>Suivant</FormButton>
          </FormLayoutButtonGroup>
        </FormLayout>
      </form>
    </AuthenticatedOnly>
  );
};

CommencerPage.getLayout = ({ children }) => {
  return (
    <RepresentationEquilibreeLayout disableAuth={true} title="Commencer">
      <FeatureStatusProvider>{children}</FeatureStatusProvider>
    </RepresentationEquilibreeLayout>
  );
};

export default CommencerPage;
