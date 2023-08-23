"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Input from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { sirenSchema } from "@common/core-domain/dtos/helpers/common";
import { PUBLIC_YEARS } from "@common/dict";
import { zodFr } from "@common/utils/zod";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { memoizedFetchSiren } from "@services/apiClient";
import { fetchDeclaration } from "@services/apiClient/declaration";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { DeclarationFormBuilder, type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { buildEntreprise } from "@services/form/declaration/entreprise";
import { sortBy } from "lodash";
import { useRouter } from "next/navigation";
import { type Session } from "next-auth";
import { useSession } from "next-auth/react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const stepName: FunnelKey = "commencer";

const baseSchema = zodFr.object({
  annéeIndicateurs: z.number(), // No control needed because this is a select with options we provide.
  siren: sirenSchema,
});

type FormType = z.infer<typeof baseSchema>;

const OWNER_ERROR = "Vous n'avez pas les droits sur ce Siren.";

const buildFormSchema = (isStaffMember: boolean, companies: Session["user"]["companies"] = []) =>
  isStaffMember
    ? baseSchema
    : baseSchema.superRefine((val, ctx) => {
        if (!companies?.some(company => company.siren === val.siren)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: OWNER_ERROR,
            path: ["siren"],
          });
        }
      });

const buildConfirmMessage = ({ siren, annéeIndicateurs }: { annéeIndicateurs: number; siren: string }) =>
  `Vous avez commencé une déclaration avec le Siren ${siren} pour l'année ${annéeIndicateurs}. Voulez-vous commencer une nouvelle déclaration et supprimer les données déjà enregistrées ?`;

/**
 * Check if declaration exists, merge it with state if any and save the state the in local storage.
 */
const prepareDataWithExistingDeclaration = async (
  siren: string,
  year: number,
  formData: DeclarationFormState,
  tokenApiV1: string,
): Promise<DeclarationFormState> => {
  const previousDeclaration = await fetchDeclaration(siren, year, {
    headers: {
      "API-KEY": tokenApiV1,
    },
    throwErrorOn404: false,
  });

  // If there is a declaration, we use it as is.
  if (previousDeclaration) {
    const newFormState = DeclarationFormBuilder.buildDeclaration(previousDeclaration.data);

    return {
      ...newFormState,
      "declaration-existante": { ...newFormState["declaration-existante"], status: "consultation" },
    };
  }

  // Otherwise, this is a creation, we use the data in session storage if the siren and year have not been changed.
  const baseFormData: DeclarationFormState =
    formData.commencer?.annéeIndicateurs === year && formData.commencer?.siren === siren
      ? formData
      : {
          "declaration-existante": {
            status: "creation",
          },
        };

  // We fetch the latest data for the entreprise to fill the entreprise page.
  const entreprise = await memoizedFetchSiren(siren, year);

  return {
    ...baseFormData,
    entreprise: {
      ...baseFormData.entreprise,
      entrepriseDéclarante: buildEntreprise(entreprise),
    },
    [stepName]: {
      annéeIndicateurs: year,
      siren,
    },
  };
};

export const CommencerForm = () => {
  const router = useRouter();
  const { formData, saveFormData, resetFormData } = useDeclarationFormManager();

  const session = useSession();

  const user = session.data?.user;

  const methods = useForm<FormType>({
    mode: "onChange",
    resolver: zodResolver(buildFormSchema(user?.staff === true, user?.companies)),
    defaultValues: formData[stepName],
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
    setError,
    watch,
  } = methods;

  if (!user?.companies.length && !user?.staff) return <SkeletonForm fields={2} />;

  const year = watch("annéeIndicateurs");

  const companies = user.companies;

  const saveAndGoNext = async ({ siren, annéeIndicateurs }: FormType, formData: DeclarationFormState) => {
    try {
      // Synchronize the data with declaration if any.
      const newData = await prepareDataWithExistingDeclaration(siren, annéeIndicateurs, formData, user.tokenApiV1);

      // Save in storage (savePageData is not used because we want to save commencer page and declaration-existante).
      saveFormData(newData);

      router.push(funnelConfig(newData)[stepName].next().url);
    } catch (error: unknown) {
      console.error("Unexpected API error", error);
      setError("siren", {
        type: "manual",
        message: error instanceof Error ? error.message : "Une erreur est survenue. Veuillez réessayer.",
      });
    }
  };

  const onSubmit = async ({ siren, annéeIndicateurs }: FormType) => {
    const { siren: sirenStorage, annéeIndicateurs: annéeIndicateursStorage } = formData[stepName] ?? {};

    // If no data are present in session storage or data are present in session storage and siren and year are unchanged.
    if (
      !sirenStorage ||
      !annéeIndicateursStorage ||
      (siren === sirenStorage && annéeIndicateurs === annéeIndicateursStorage)
    ) {
      return await saveAndGoNext({ siren, annéeIndicateurs }, formData);
    }

    // In data are present in session storage and siren and year are not the same.
    if (confirm(buildConfirmMessage({ siren: sirenStorage, annéeIndicateurs: annéeIndicateursStorage }))) {
      // Start a new declaration of representation.
      resetFormData();
      await saveAndGoNext({ siren, annéeIndicateurs }, formData);
    } else {
      // Rollback to the old Siren.
      setValue("siren", sirenStorage);
    }
  };

  const confirmReset = () => {
    if (confirm("Les données ne sont pas sauvegardées, êtes-vous sûr de vouloir réinitialiser le formulaire ?")) {
      setValue("siren", "");
      if (PUBLIC_YEARS[0]) {
        setValue("annéeIndicateurs", PUBLIC_YEARS[0]);
      }

      resetFormData();
    }
  };

  return (
    <>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
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

          {user.staff ? (
            <Input
              label="Siren entreprise (staff)"
              state={errors.siren && "error"}
              stateRelatedMessage={errors.siren?.message}
              nativeInputProps={{
                ...register("siren"),
                maxLength: 9,
                minLength: 9,
              }}
            />
          ) : (
            <Select
              label="Numéro Siren de l’entreprise ou de l’entreprise déclarant pour le compte de l’UES (Unité Économique et Sociale)"
              state={errors.siren && "error"}
              stateRelatedMessage={errors.siren?.message}
              nativeSelectProps={register("siren")}
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
          )}

          <ClientAnimate>
            {isValid && (
              <Alert
                severity="info"
                small
                description={`Vous allez procéder ou accéder à la déclaration de votre index de l’égalité professionnelle pour l’année ${year} au titre des données de ${
                  year - 1
                }.`}
              />
            )}
          </ClientAnimate>

          <BackNextButtonsGroup
            className={fr.cx("fr-my-4w")}
            backLabel="Réinitialiser"
            backProps={{
              onClick: confirmReset,
              disabled: formData ? !formData.entreprise?.entrepriseDéclarante?.siren : false,
              iconId: undefined,
            }}
            nextProps={{
              disabled: !isValid,
            }}
          />
        </form>
      </FormProvider>
    </>
  );
};
