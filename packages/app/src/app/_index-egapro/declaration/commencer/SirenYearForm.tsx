"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { config } from "@common/config";
import { PUBLIC_YEARS } from "@common/dict";
import { zodPositiveIntegerSchema, zodSirenSchema } from "@common/utils/form";
import { MailtoLinkForNonOwner } from "@components/MailtoLink";
import { GlobalMessage, type Message } from "@components/next13/GlobalMessage";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkSiren, memoizedFetchSiren } from "@services/apiClient";
import { fetchDeclaration } from "@services/apiClient/declaration";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { DeclarationFormBuilder, type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { buildEntreprise } from "@services/form/declaration/entreprise";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const OWNER_ERROR = "Vous n'avez pas les droits sur ce Siren";

const formSchema = z
  .object({
    annéeIndicateurs: zodPositiveIntegerSchema, // No control needed because this is a select with options we provide.
    siren: zodSirenSchema,
  })
  .superRefine(async ({ annéeIndicateurs: year, siren }, ctx) => {
    console.log("dans superRefine");

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
      // TODO: uncomment when useUser is available
      // try {
      //   await ownersForSiren(siren);
      // } catch (error: unknown) {
      //   console.error("error", error);
      //   ctx.addIssue({
      //     code: z.ZodIssueCode.custom,
      //     message: OWNER_ERROR,
      //     path: ["siren"],
      //   });
      // }
    }
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

  const sirenStorage = formData?.commencer?.entrepriseDéclarante?.siren || "";
  const annéeIndicateursStorage =
    formData?.commencer?.annéeIndicateurs === undefined ? "" : String(formData?.commencer?.annéeIndicateurs);

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
      siren: sirenStorage,
      annéeIndicateurs: annéeIndicateursStorage,
    },
  });

  const siren = watch("siren");
  const annéeIndicateurs = watch("annéeIndicateurs");

  useEffect(() => {
    // Reset global error message.
    setGlobalMessage(undefined);
  }, [siren, annéeIndicateurs, setGlobalMessage]);

  useEffect(() => {
    // Special case when the user has no ownership on the Siren.
    if (errors.siren && errors.siren.message === OWNER_ERROR) {
      setGlobalMessage({ type: "error", description: <MailtoLinkForNonOwner siren={siren} /> });
    }
  }, [errors.siren, setGlobalMessage, siren]);

  /**
   * Check if declaration exists, merge it with state if any and save the state the in local storage.
   */
  const prepareDataWithExistingDeclaration = async (siren: string, year: number): Promise<DeclarationFormState> => {
    const previousDeclaration = await fetchDeclaration(siren, year, { throwErrorOn404: false });

    if (previousDeclaration) {
      const newFormState = DeclarationFormBuilder.buildDeclaration(previousDeclaration.data);

      return { ...newFormState, _metadata: { ...newFormState._metadata, status: "edition" as const } };
    }

    // Otherwise, this is a creation, so we start with fetching firm's data.
    const entreprise = await memoizedFetchSiren(siren, Number(year));

    return {
      _metadata: {
        status: "creation" as const,
      },
      commencer: {
        annéeIndicateurs: Number(year),
        entrepriseDéclarante: {
          ...buildEntreprise(entreprise),
        },
      },
    };
  };

  const getNextPage = (data?: DeclarationFormState) =>
    data?._metadata?.status === "edition"
      ? `${config.base_declaration_url}/${siren}/${annéeIndicateurs}`
      : `${config.base_declaration_url}/entreprise`;

  const saveAndExit = async ({ annéeIndicateurs: year, siren }: FormType) => {
    const newData = await prepareDataWithExistingDeclaration(siren, Number(year));

    saveFormData(newData);

    const nextPage = getNextPage(newData);

    console.log("nextPage:", nextPage);

    router.push(getNextPage(newData));
  };

  const onSubmit = async ({ annéeIndicateurs: year, siren }: FormType) => {
    // If no data are present in session storage.
    if (!sirenStorage) {
      saveAndExit({ siren, annéeIndicateurs: year });
      return;
    }

    if (siren !== sirenStorage || year !== annéeIndicateursStorage) {
      if (confirm(buildConfirmMessage({ siren: sirenStorage, year: annéeIndicateursStorage }))) {
        // Start a new declaration of representation.
        resetFormData();
        saveAndExit({ siren, annéeIndicateurs: year });
        return;
      } else {
        // Rollback to the old Siren.
        setValue("siren", sirenStorage);
        return;
      }
    }

    // In this last case, the siren is already in session storage and unchanged and the user wants to continue.
    router.push(getNextPage());
  };

  const confirmResetFormData = () => {
    if (confirm("Les données ne sont pas sauvegardées, êtes-vous sûr de vouloir réinitialiser le formulaire ?")) {
      resetFormData();
      setValue("siren", "");
      setValue("annéeIndicateurs", "");
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
          nativeSelectProps={{ ...register("annéeIndicateurs") }}
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
          <Button type="reset" priority="secondary" disabled={!sirenStorage} onClick={confirmResetFormData}>
            Réinitialiser
          </Button>
          <Button disabled={!isValid}>Suivant</Button>
        </div>
      </form>
    </>
  );
};
