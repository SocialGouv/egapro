"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { createSteps } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { isCompanyClosed } from "@common/core-domain/helpers/entreprise";
import { REPEQ_ADMIN_YEARS, YEARS } from "@common/dict";
import { BackNextButtonsGroup, FormLayout } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type Session } from "next-auth";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { NOT_FOUND_SIREN } from "../../../messages";
import { getRepresentationEquilibree } from "../../actions";
import {
  useRepeqFunnelClientStore,
  useRepeqFunnelStoreHasHydrated,
} from "../useRepeqFunnelStore";

type CommencerFormType = z.infer<typeof createSteps.commencer>;

const buildConfirmMessage = ({
  siren,
  year,
}: {
  siren: string;
  year: number;
}) =>
  `Vous avez commencé une déclaration avec le Siren ${siren} et l'année ${year}. Voulez-vous commencer une nouvelle déclaration et supprimer les données déjà enregistrées ?`;

const OWNER_ERROR = "Vous n'avez pas les droits sur ce Siren.";

export const CommencerForm = ({ session }: { session: Session }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  /** ✅ store Zustand HYDRATÉ */
  const hasHydrated = useRepeqFunnelStoreHasHydrated();
  const { funnel, saveFunnel, resetFunnel, isEdit, setIsEdit } =
    useRepeqFunnelClientStore();

  const organization = session.user.entreprise;

  /** ---------------- Schema ---------------- */
  const schemaWithOwnedSiren = session.user.staff
    ? createSteps.commencer
    : createSteps.commencer.superRefine((_, ctx) => {
        if (!organization) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: OWNER_ERROR,
            path: ["siren"],
          });
        }
      });

  /** ---------------- React Hook Form ---------------- */
  const {
    register,
    handleSubmit,
    setValue,
    reset: resetForm,
    formState: { errors, isValid },
    setError,
  } = useForm<CommencerFormType>({
    mode: "onChange",
    resolver: zodResolver(schemaWithOwnedSiren),
    defaultValues: funnel,
  });

  /** ---------------- Navigation ---------------- */
  const saveAndGoNext = async (siren: string, year: number) => {
    const exists = await getRepresentationEquilibree(siren, year);
    if (exists) {
      router.push(`/representation-equilibree/${siren}/${year}`);
      return;
    }

    /** ✅ Initialisation du funnel */
    startTransition(() => {
      setIsEdit(false);
      saveFunnel({ siren, year });
      router.push("/representation-equilibree/declarant");
    });
  };

  /** ---------------- Submit ---------------- */
  const onSubmit = async ({ siren, year }: CommencerFormType) => {
    if (!hasHydrated) return;

    const { siren: funnelSiren, year: funnelYear } = funnel ?? {};

    // ✅ Premier passage (cas NORMAL)
    if (!(funnelSiren && funnelYear)) {
      await saveAndGoNext(siren, year);
      return;
    }

    // ✅ Même déclaration
    if (siren === funnelSiren && year === funnelYear) {
      router.push(
        isEdit
          ? `/representation-equilibree/${siren}/${year}`
          : "/representation-equilibree/declarant",
      );
      return;
    }

    // ✅ Nouvelle déclaration → confirmation
    if (
      confirm(buildConfirmMessage({ siren: funnelSiren, year: funnelYear }))
    ) {
      resetFunnel();
      await saveAndGoNext(siren, year);
    } else {
      setValue("siren", funnelSiren);
    }
  };

  /** ---------------- Reset ---------------- */
  const confirmReset = () => {
    if (
      confirm(
        "Les données ne sont pas sauvegardées, êtes-vous sûr de vouloir réinitialiser le parcours ?",
      )
    ) {
      resetFunnel();
      resetForm();
      if (session.user.staff) setValue("siren", "");
    }
  };

  /** ---------------- Init siren non staff ---------------- */
  useEffect(() => {
    if (!session.user.staff && session.user.entreprise?.siren) {
      setValue("siren", session.user.entreprise.siren, {
        shouldValidate: true,
      });
    }
  }, [session.user, setValue]);

  /** ---------------- Sync store siren with session for non-staff ---------------- */
  useEffect(() => {
    if (
      hasHydrated &&
      !session.user.staff &&
      session.user.entreprise?.siren &&
      funnel &&
      funnel.siren !== session.user.entreprise.siren
    ) {
      saveFunnel({ siren: session.user.entreprise.siren });
    }
  }, [hasHydrated, session.user, funnel, saveFunnel]);

  /** ---------------- Render ---------------- */
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <p className="fr-text--xs">Les champs suivis d'une * sont obligatoires</p>

      <FormLayout>
        <Select
          label="Année au titre de laquelle les écarts de représentation sont calculés *"
          state={errors.year && "error"}
          stateRelatedMessage={errors.year?.message}
          nativeSelectProps={register("year", { valueAsNumber: true })}
        >
          <option value="" disabled>
            Sélectionnez une année
          </option>
          {(session.user.staff ? REPEQ_ADMIN_YEARS : YEARS)
            .slice()
            .reverse()
            .map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
        </Select>

        {session.user.staff ? (
          <Input
            label="Siren entreprise *"
            state={errors.siren && "error"}
            stateRelatedMessage={errors.siren?.message}
            nativeInputProps={register("siren")}
          />
        ) : (
          <>
            {/* 🔑 champ requis pour RHF */}
            <input
              type="hidden"
              {...register("siren")}
              value={session.user.entreprise?.siren}
            />

            <label className={fr.cx("fr-label")}>Siren entreprise</label>
            <p className={fr.cx("fr-mt-1w")}>
              {session.user.entreprise?.label}
            </p>
          </>
        )}

        <BackNextButtonsGroup
          className={fr.cx("fr-my-6w")}
          backLabel="Réinitialiser"
          backProps={{ onClick: confirmReset }}
          nextDisabled={!hasHydrated || !isValid || isPending}
        />
      </FormLayout>
    </form>
  );
};
