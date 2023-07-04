"use client";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { createSteps } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { YEARS_REPEQ } from "@common/dict";
import { ReactHookFormDebug } from "@components/RHF/ReactHookFormDebug";
import { FormLayout } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { sortBy } from "lodash";
import { useRouter } from "next/navigation";
import { type Session } from "next-auth";
import { useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { getRepresentationEquilibree } from "../../actions";
import { useRepeqFunnelStore } from "../useRepeqFunnelStore";

type CommencerFormType = z.infer<typeof createSteps.commencer>;

const buildConfirmMessage = ({ siren, year }: { siren: string; year: number }) =>
  `Vous avez commencé une déclaration avec le Siren ${siren} et l'année ${year}. Voulez-vous commencer une nouvelle déclaration et supprimer les données déjà enregistrées ?`;

const OWNER_ERROR = "Vous n'avez pas les droits sur ce Siren.";

export const CommencerForm = ({ session }: { session: Session }) => {
  const router = useRouter();
  const { funnel, saveFunnel, resetFunnel, isEdit, setIsEdit } = useRepeqFunnelStore();
  const [isPending, startTransition] = useTransition();

  const companies = session.user.companies;

  const schemaWithOwnedSiren = session.user.staff
    ? createSteps.commencer
    : createSteps.commencer.superRefine((val, ctx) => {
        console.log("companies:", companies);

        if (!companies.some(company => company.siren === val.siren)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: OWNER_ERROR,
            path: ["siren"],
          });
        }
      });

  const methods = useForm<CommencerFormType>({
    mode: "onChange",
    resolver: zodResolver(schemaWithOwnedSiren),
    defaultValues: funnel,
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset: resetForm,
    formState: { errors, isValid },
  } = methods;

  const saveAndGoNext = async (siren: string, year: number) =>
    startTransition(async () => {
      try {
        // Synchronise with potential data in DB.
        const exists = await getRepresentationEquilibree(siren, year);
        if (exists) {
          return router.push(`/representation-equilibree/${siren}/${year}`);
        }

        // Otherwise, this is a creation.
        setIsEdit(false);
        resetFunnel();
        saveFunnel({ year, siren });
        router.push("/representation-equilibree/declarant");
      } catch (error) {
        // We can't continue in this case, because the backend is not ready.
        console.error("Unexpected API error", error);
        resetFunnel();
      }
    });

  const onSubmit = async ({ siren, year }: CommencerFormType) => {
    const { siren: funnelSiren, year: funnelYear } = funnel ?? {};
    // If no data are present in session storage.
    if (!(funnelSiren && funnelYear)) {
      return saveAndGoNext(siren, year);
    }

    // If data are present in session storage and Siren and year have not changed.
    if (siren === funnelSiren && year === funnelYear) {
      return router.push(
        isEdit ? `/representation-equilibree/${siren}/${year}` : "/representation-equilibree/declarant",
      );
    }

    // If Siren or year have changed, we ask the user if he really wants to erase the data.
    if (confirm(buildConfirmMessage({ siren: funnelSiren, year: funnelYear }))) {
      // Start a new declaration of representation.
      resetFunnel();
      await saveAndGoNext(siren, year);
    } else {
      // Rollback to the old Siren.
      setValue("siren", funnelSiren);
    }
  };

  const confirmReset = () => {
    if (confirm("Les données ne sont pas sauvegardées, êtes-vous sûr de vouloir réinitialiser le parcours ?")) {
      resetFunnel();
      resetForm();
    }
  };

  const yearsRepEq = YEARS_REPEQ.sort().reverse();

  return (
    <>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <ReactHookFormDebug />
          <FormLayout>
            <Select
              label="Année au titre de laquelle les écarts de représentation sont calculés"
              state={errors.year && "error"}
              stateRelatedMessage={errors.year?.message}
              nativeSelectProps={register("year", {
                valueAsNumber: true,
              })}
            >
              <option value="" disabled>
                Sélectionnez une année
              </option>
              {yearsRepEq.map(year => (
                <option value={year} key={`year-select-${year}`}>
                  {year}
                </option>
              ))}
            </Select>
            {session.user.staff ? (
              <Input
                label="Siren entreprise (staff)"
                state={errors.siren && "error"}
                stateRelatedMessage={errors.siren?.message}
                nativeInputProps={register("siren")}
              />
            ) : (
              <Select
                label="Entreprise"
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
            <ButtonsGroup
              inlineLayoutWhen="sm and up"
              buttons={[
                {
                  children: "Réinitialiser",
                  priority: "secondary",
                  onClick: confirmReset,
                  type: "button",
                  nativeButtonProps: {
                    disabled: funnel ? !funnel.siren : false,
                  },
                },
                {
                  children: "Suivant",
                  type: "submit",
                  nativeButtonProps: {
                    disabled: !isValid && !isPending,
                  },
                },
              ]}
            />
          </FormLayout>
        </form>
      </FormProvider>
    </>
  );
};
