"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { PUBLIC_YEARS } from "@common/dict";
import { zodSirenSchema } from "@common/utils/form";
import { MailtoLinkForNonOwner } from "@components/MailtoLink";
import { GlobalMessage } from "@components/next13/GlobalMessage";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const OWNER_ERROR = "Vous n'avez pas les droits sur ce Siren";

const formSchema = z
  .object({
    year: z.string().min(1, "L'année est requise."), // No control needed because this is a select with options we provide.
    siren: zodSirenSchema,
  })
  .superRefine(async ({ year, siren }, ctx) => {
    console.log("dans superRefine");

    // TODO: uncomment when useUser is available

    // if (siren && siren.length === 9) {
    //   try {
    //     await checkSiren(siren, Number(year));
    //   } catch (error: unknown) {
    //     console.error("error", error);
    //     ctx.addIssue({
    //       code: z.ZodIssueCode.custom,
    //       message: error instanceof Error ? error.message : "Le Siren est invalide.",
    //       path: ["siren"],
    //     });
    //     return z.NEVER; // Abort early when there is an error in the first API call.
    //   }
    //   try {
    //     await ownersForSiren(siren);
    //   } catch (error: unknown) {
    //     console.error("error", error);
    //     ctx.addIssue({
    //       code: z.ZodIssueCode.custom,
    //       message: OWNER_ERROR,
    //       path: ["siren"],
    //     });
    //   }
    // }
  });

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

const buildConfirmMessage = ({ siren, year }: { siren: string; year: string }) =>
  `Vous avez commencé une déclaration avec le Siren ${siren} pour l'année ${year}. Voulez-vous commencer une nouvelle déclaration et supprimer les données déjà enregistrées ?`;

export const SirenYearForm = () => {
  // useUserNext13();
  const router = useRouter();
  const { formData, saveFormData, resetFormData } = useDeclarationFormManager();
  const [globalMessage, setGlobalMessage] = useState<Message | undefined>(undefined);

  const sirenInStorage = formData?.commencer?.siren || "";
  const yearInStorage = formData?.commencer?.year === undefined ? "" : String(formData?.commencer?.year);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormType>({
    mode: "onTouched",
    resolver: zodResolver(formSchema),
    defaultValues: {
      siren: sirenInStorage,
      year: yearInStorage,
    },
  });

  const siren = watch("siren");
  const year = watch("year");

  console.log("siren", siren);
  console.log("isValid", isValid);

  useEffect(() => {
    setGlobalMessage(undefined);
  }, [siren, year, setGlobalMessage]);

  useEffect(() => {
    if (errors.siren && errors.siren.message === OWNER_ERROR) {
      setGlobalMessage({ type: "error", description: <MailtoLinkForNonOwner siren={siren} /> });
    }
  }, [errors.siren, setGlobalMessage, siren]);

  const saveAndGoNext = async (siren: string, year: number) => {
    try {
      // Synchronise with potential data in DB.
      // TODO: uncomment when service is available
      //const previousDeclaration = await fetchDeclaration(siren, year, { throwErrorOn404: false });

      // if (previousDeclaration) {
      //   saveFormData({ ...previousDeclaration, _externalData: { ...formData._externalData, status: "edition" } });
      //   router.push(`/_index-egapro/declaration/${siren}/${year}`);
      //   return;
      // }
      // // Otherwise, this is a creation, so we begin with fetching firm's data.
      // const entreprise = await fetchSiren(siren, Number(year));
      // saveFormData({
      //   _externalData: {
      //     status: "creation",
      //     entreprise,
      //   },
      //   commencer: {
      //     siren,
      //     year: Number(year),
      //   },
      // });
      router.push("/_index-egapro/declaration/entreprise");
    } catch (error) {
      // We can't continue in this case, because the backend is not ready.
      console.error("Unexpected API error", error);
      setGlobalMessage({
        type: "error",
        description: <>Le service est indisponible pour l'instant. Veuillez réessayer plus tard.</>,
      });
    }
  };

  const onSubmit = async ({ year, siren }: FormType) => {
    console.log("dans onSubmit", year, siren);
    // If no data are present in session storage.
    if (!sirenInStorage) {
      await saveAndGoNext(siren, Number(year));
      return;
    }
    // If data are present in session storage and Siren and year have not changed.
    if (siren === sirenInStorage && year === yearInStorage) {
      router.push(
        formData._externalData?.status === "edition"
          ? `/_index-egapro/declaration/${siren}/${year}`
          : "/_index-egapro/declaration/declarant",
      );
      return;
    }
    // If Siren or year have changed, we ask the user if he really wants to erase the data.
    if (confirm(buildConfirmMessage({ siren: sirenInStorage, year: yearInStorage }))) {
      // Start a new declaration of representation.
      resetFormData();
      await saveAndGoNext(siren, Number(year));
    } else {
      // Rollback to the old Siren.
      setValue("siren", sirenInStorage);
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
    <>
      <GlobalMessage message={globalMessage} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* <pre>{JSON.stringify(watch(), null, 2)}</pre> */}
        {/* <pre>{formatZodErrors(errors)}</pre> */}

        <Select
          label="Année au titre de laquelle les indicateurs sont calculés"
          nativeSelectProps={{ ...register("year") }}
        >
          <option value="" disabled hidden>
            Selectionnez une option
          </option>
          {PUBLIC_YEARS.sort()
            .reverse()
            .map(year => (
              <option value={year} key={year}>
                {year}
              </option>
            ))}
        </Select>
        <Input
          label="Numéro Siren de l’entreprise ou de l’entreprise déclarant pour le compte de l’UES (Unité Économique et Sociale)"
          hintText="Le numéro Siren se compose de 9 chiffres"
          state={errors.siren?.message ? "error" : "default"}
          stateRelatedMessage={errors.siren?.message}
          nativeInputProps={{ ...register("siren"), placeholder: "Ex: 504920166, 403461742, 403696735", maxLength: 9 }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          {/* <Button disabled={!featureStatus.type === "loading" || !isValid}>Envoyer</Button> */}
          <Button type="reset" priority="secondary" disabled={!sirenInStorage} onClick={confirmResetFormData}>
            Réinitialiser
          </Button>
          <Button disabled={!isValid}>Suivant</Button>
        </div>
      </form>
    </>
  );
};
