"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Input from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { PUBLIC_YEARS } from "@common/dict";
import { zodSirenSchema } from "@common/utils/form";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup } from "@design-system";
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

const baseSchema = z.object({
  annéeIndicateurs: z.number(), // No control needed because this is a select with options we provide.
  siren: zodSirenSchema,
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
  tokenApiV1: string,
): Promise<DeclarationFormState> => {
  const previousDeclaration = await fetchDeclaration(siren, year, {
    headers: {
      "API-KEY": tokenApiV1,
    },
    throwErrorOn404: false,
  });

  if (previousDeclaration) {
    const newFormState = DeclarationFormBuilder.buildDeclaration(previousDeclaration.data);

    return {
      ...newFormState,
      "declaration-existante": { ...newFormState["declaration-existante"], status: "consultation" },
    };
  }

  // Otherwise, this is a creation, so we start with fetching firm's data.
  const entreprise = await memoizedFetchSiren(siren, year);

  return {
    "declaration-existante": {
      status: "creation",
    },
    [stepName]: {
      annéeIndicateurs: year,
      entrepriseDéclarante: buildEntreprise(entreprise),
    },
  };
};

export const CommencerForm = () => {
  const router = useRouter();
  const { formData, saveFormData, resetFormData } = useDeclarationFormManager();

  const session = useSession();

  const user = session.data?.user;

  const methods = useForm<FormType>({
    mode: "onTouched",
    resolver: zodResolver(buildFormSchema(user?.staff === true, user?.companies)),
    defaultValues: { ...formData[stepName], siren: formData.commencer?.entrepriseDéclarante?.siren },
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset: resetForm,
    formState: { errors, isValid },
  } = methods;

  if (!user?.companies.length && !user?.staff) return <SkeletonForm fields={2} />;

  const companies = user.companies;

  const saveAndGoNext = async ({ annéeIndicateurs, siren }: FormType) => {
    // Synchronize the data with declaration if any.
    const newData = await prepareDataWithExistingDeclaration(siren, annéeIndicateurs, user.tokenApiV1);

    // Save in storage (savePageData is not used because we want to save commencer page and declaration-existante).
    saveFormData(newData);

    router.push(funnelConfig(newData)[stepName].next().url);
  };

  const onSubmit = async ({ annéeIndicateurs, siren }: FormType) => {
    const { entrepriseDéclarante, annéeIndicateurs: annéeIndicateursStorage } = formData[stepName] ?? {};

    const sirenStorage = entrepriseDéclarante?.siren;

    // If no data are present in session storage or data are present in session storage and siren and year are unchanged.
    if (
      !sirenStorage ||
      !annéeIndicateursStorage ||
      (siren === sirenStorage && annéeIndicateurs === annéeIndicateursStorage)
    ) {
      return await saveAndGoNext({ siren, annéeIndicateurs });
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
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* <ReactHookFormDebug /> */}

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
              label="Siren de l'entreprise"
              state={errors.siren && "error"}
              stateRelatedMessage={errors.siren?.message}
              nativeInputProps={register("siren")}
            />
          ) : (
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
          )}

          <BackNextButtonsGroup
            className={fr.cx("fr-my-8w")}
            backLabel="Réinitialiser"
            backProps={{
              onClick: confirmReset,
              disabled: formData ? !formData[stepName]?.entrepriseDéclarante?.siren : false,
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
