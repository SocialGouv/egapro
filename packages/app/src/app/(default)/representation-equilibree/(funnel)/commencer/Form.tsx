"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { createSteps } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { isCompanyClosed } from "@common/core-domain/helpers/entreprise";
import { REPEQ_ADMIN_YEARS, YEARS } from "@common/dict";
import { BackNextButtonsGroup, FormLayout, Icon, Link } from "@design-system";
import { getCompany } from "@globalActions/company";
import { CompanyErrorCodes } from "@globalActions/companyErrorCodes";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type Session } from "next-auth";
import { signIn } from "next-auth/react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { NOT_FOUND_SIREN } from "../../../messages";
import { getRepresentationEquilibree } from "../../actions";
import { useRepeqFunnelStore } from "../useRepeqFunnelStore";

type CommencerFormType = z.infer<typeof createSteps.commencer>;

const buildConfirmMessage = ({ siren, year }: { siren: string; year: number }) =>
  `Vous avez commencé une déclaration avec le Siren ${siren} et l'année ${year}. Voulez-vous commencer une nouvelle déclaration et supprimer les données déjà enregistrées ?`;

const OWNER_ERROR = "Vous n'avez pas les droits sur ce Siren.";
export const CommencerForm = ({ session, proconnectHost }: { proconnectHost: string; session: Session }) => {
  const router = useRouter();
  const { funnel, saveFunnel, resetFunnel, isEdit, setIsEdit } = useRepeqFunnelStore();
  const [isPending, startTransition] = useTransition();

  const organization = session.user.organization;

  const schemaWithOwnedSiren = session.user.staff
    ? createSteps.commencer
    : createSteps.commencer.superRefine((val, ctx) => {
        if (!organization) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: OWNER_ERROR,
            path: ["siren"],
          });
        }
      });

  const {
    register,
    handleSubmit,
    setValue,
    reset: resetForm,
    formState: { errors, isValid, },
    setError,
  } = useForm<CommencerFormType>({
    mode: "onChange",
    resolver: zodResolver(schemaWithOwnedSiren),
    defaultValues: funnel,
  });

  const saveAndGoNext = async (siren: string, year: number) =>
    startTransition(async () => {
      // Synchronise with potential data in DB.
      const exists = await getRepresentationEquilibree(siren, year);
      if (exists) {
        return router.push(`/representation-equilibree/${siren}/${year}`);
      }

      const company = await getCompany(siren);

      if (!company.ok) {
        if (company.error === CompanyErrorCodes.NOT_FOUND)
          return setError("siren", {
            type: "manual",
            message: NOT_FOUND_SIREN,
          });
        return setError("siren", {
          type: "manual",
          message: "Erreur lors de la récupération des données de l'entreprise, veuillez vérifier votre saisie",
        });
      } else if (isCompanyClosed(company.data, year)) {
        return setError("siren", {
          type: "manual",
          message: "Le Siren saisi correspond à une entreprise fermée, veuillez vérifier votre saisie",
        });
      }

      // Otherwise, this is a creation.
      setIsEdit(false);
      resetFunnel();
      saveFunnel({ year, siren });
      router.push("/representation-equilibree/declarant");
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
      if (session.user.staff) setValue("siren", "");
    }
  };

  console.log("errors", errors);
  console.log("isValid", isValid);
  console.log("isPending", isPending);
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <p className="fr-text--xs">Les champs suivis d'une * sont obligatoires</p>
        <FormLayout>
          <Select
            label="Année au titre de laquelle les écarts de représentation sont calculés *"
            state={errors.year && "error"}
            stateRelatedMessage={errors.year?.message}
            nativeSelectProps={register("year", {
              valueAsNumber: true,
            })}
          >
            <option value="" disabled>
              Sélectionnez une année
            </option>
            {session.user.staff
              ? REPEQ_ADMIN_YEARS.map(year => (
                  <option value={year} key={`year-select-${year}`}>
                    {year}
                  </option>
                )).reverse()
              : YEARS.map(year => (
                  <option value={year} key={`year-select-${year}`}>
                    {year}
                  </option>
                )).reverse()}
          </Select>
          {session.user.staff ? (
            <Input
              label="Siren entreprise (staff) *"
              state={errors.siren && "error"}
              stateRelatedMessage={errors.siren?.message}
              nativeInputProps={{
                ...register("siren"),
                maxLength: 9,
                minLength: 9,
              }}
            />
          ) : (
            <>
              <label className={fr.cx("fr-label")}>Siren entreprise</label>
              <p>{session.user?.organization?.siren}
                    {session.user?.organization?.label ? ` (${session.user?.organization?.label})` : ""}</p>
            </>
          )}
          <BackNextButtonsGroup
            className={fr.cx("fr-my-6w")}
            backProps={{
              onClick: confirmReset,
              iconId: void 0,
            }}
            nextDisabled={!isValid && !isPending}
            backDisabled={funnel ? !funnel.siren : false}
            backLabel="Réinitialiser"
          />
        </FormLayout>
      </form>
    </>
  );
};
