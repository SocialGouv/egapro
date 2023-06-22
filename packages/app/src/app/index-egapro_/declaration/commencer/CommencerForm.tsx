"use client";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { config } from "@common/config";
import { PUBLIC_YEARS } from "@common/dict";
import { zodSirenSchema } from "@common/utils/form";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { memoizedFetchSiren } from "@services/apiClient";
import { fetchDeclaration } from "@services/apiClient/declaration";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { DeclarationFormBuilder, type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { buildEntreprise } from "@services/form/declaration/entreprise";
import { sortBy } from "lodash";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  annéeIndicateurs: z.number(), // No control needed because this is a select with options we provide.
  siren: zodSirenSchema,
});

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

const buildConfirmMessage = ({ siren, annéeIndicateurs }: { annéeIndicateurs: number; siren: string }) =>
  `Vous avez commencé une déclaration avec le Siren ${siren} pour l'année ${annéeIndicateurs}. Voulez-vous commencer une nouvelle déclaration et supprimer les données déjà enregistrées ?`;

export const CommencerForm = () => {
  const router = useRouter();
  const { formData, saveFormData, resetFormData } = useDeclarationFormManager();

  const session = useSession();

  // assert(
  //   session.data && session.data?.user?.companies.length,
  //   "User should have companies in session. The parent page should check it.",
  // );

  const {
    register,
    handleSubmit,
    setValue,
    reset: resetForm,
    formState: { errors, isValid },
  } = useForm<FormType>({
    mode: "onTouched",
    resolver: zodResolver(formSchema),
    defaultValues: formData.commencer,
  });

  if (!session.data || !session.data?.user?.companies.length) return <SkeletonForm fields={2} />;

  const companies = session.data.user.companies;

  /**
   * Check if declaration exists, merge it with state if any and save the state the in local storage.
   */
  const prepareDataWithExistingDeclaration = async (
    siren: string,
    year: number,
    tokenV1: string,
  ): Promise<DeclarationFormState> => {
    const previousDeclaration = await fetchDeclaration(siren, year, {
      headers: {
        "API-KEY": tokenV1,
      },
      throwErrorOn404: false,
    });

    if (previousDeclaration) {
      const newFormState = DeclarationFormBuilder.buildDeclaration(previousDeclaration.data);

      return { ...newFormState, _metadata: { ...newFormState._metadata, status: "edition" as const } };
    }

    // Otherwise, this is a creation, so we start with fetching firm's data.
    const entreprise = await memoizedFetchSiren(siren, year);

    return {
      _metadata: {
        status: "creation" as const,
      },
      commencer: {
        annéeIndicateurs: year,
        entrepriseDéclarante: {
          ...buildEntreprise(entreprise),
        },
      },
    };
  };

  const nextPage = (data?: DeclarationFormState) =>
    data?._metadata?.status === "edition"
      ? `${config.base_declaration_url}/${data.commencer?.entrepriseDéclarante?.siren}/${data.commencer?.annéeIndicateurs}`
      : `${config.base_declaration_url}/entreprise`;

  const saveAndGoNext = async ({ annéeIndicateurs, siren }: FormType) => {
    // Synchronize the data with declaration if any.
    const newData = await prepareDataWithExistingDeclaration(
      siren,
      Number(annéeIndicateurs),
      session.data.user.tokenApiV1,
    );

    // Save in storage (savePageData is not used because we want to save commencer page and _metadata).
    saveFormData(newData);

    // Navigate to next page.
    router.push(nextPage(newData));
  };

  const onSubmit = async ({ annéeIndicateurs, siren }: FormType) => {
    const { entrepriseDéclarante, annéeIndicateurs: annéeIndicateursStorage } = formData.commencer ?? {};

    const sirenStorage = entrepriseDéclarante?.siren;

    // If no data are present in session storage.
    if (!sirenStorage || !annéeIndicateursStorage) {
      return await saveAndGoNext({ siren, annéeIndicateurs });
    }

    // In data are present in session storage and siren and year are unchanged.
    if (siren === sirenStorage && annéeIndicateurs === annéeIndicateursStorage) {
      return router.push(nextPage());
    }

    // In data are present in session storage and siren and year are not the same.
    if (confirm(buildConfirmMessage({ siren: sirenStorage, annéeIndicateurs: annéeIndicateursStorage }))) {
      // Start a new declaration of representation.
      resetFormData();
      await saveAndGoNext({ siren, annéeIndicateurs });
    } else {
      // Rollback to the old Siren.
      setValue("siren", sirenStorage);
    }
  };

  const confirmReset = () => {
    if (confirm("Les données ne sont pas sauvegardées, êtes-vous sûr de vouloir réinitialiser le formulaire ?")) {
      resetFormData();
      resetForm();
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* <pre>{JSON.stringify(watch(), null, 2)}</pre> */}
        {/* <pre>{formatZodErrors(errors)}</pre> */}

        <Select
          label="Année au titre de laquelle les indicateurs sont calculés"
          state={errors.annéeIndicateurs && "error"}
          stateRelatedMessage={errors.annéeIndicateurs?.message}
          nativeSelectProps={{
            ...register("annéeIndicateurs", {
              valueAsNumber: true,
            }),
          }}
        >
          <option value="" disabled>
            Sélectionnez une année
          </option>
          {PUBLIC_YEARS.map(year => (
            <option value={year} key={`year-select-${year}`}>
              {year}
            </option>
          ))}
        </Select>

        <Select
          label="Numéro Siren de l’entreprise ou de l’entreprise déclarant pour le compte de l’UES (Unité Économique et Sociale)"
          state={errors.siren && "error"}
          stateRelatedMessage={errors.siren?.message}
          nativeSelectProps={{
            ...register("siren"),
          }}
        >
          <option value="" disabled>
            Sélectionnez une entreprise
          </option>
          {sortBy(companies, "siren").map(company => (
            <option key={company.siren} value={company.siren}>
              {company.siren}
              {company.label ? ` (${company.label})` : ""}
            </option>
          ))}
        </Select>

        {/* <div style={{ display: "flex", gap: 10 }}>
          <Button type="reset" priority="secondary" disabled={!sirenStorage} onClick={confirmResetFormData}>
            Réinitialiser
          </Button>
          <Button disabled={!isValid}>Suivant</Button>
        </div> */}

        <ButtonsGroup
          inlineLayoutWhen="sm and up"
          buttons={[
            {
              children: "Réinitialiser",
              priority: "secondary",
              onClick: confirmReset,
              type: "button",
              nativeButtonProps: {
                disabled: formData ? !formData.commencer?.entrepriseDéclarante?.siren : false,
              },
            },
            {
              children: "Suivant",
              type: "submit",
              nativeButtonProps: {
                disabled: !isValid,
              },
            },
          ]}
        />
      </form>
    </>
  );
};
