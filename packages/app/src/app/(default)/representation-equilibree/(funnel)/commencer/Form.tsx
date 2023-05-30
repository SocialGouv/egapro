"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { createSteps } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { YEARS_REPEQ } from "@common/dict";
import { FormLayout } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { getRepresentationEquilibree } from "../actions";
import { useRepeqFunnelStore } from "../useRepeqFunnelStore";

type CommencerFormType = z.infer<typeof createSteps.commencer>;

const buildConfirmMessage = ({ siren, year }: { siren: string; year: number }) =>
  `Vous avez commencé une déclaration avec le Siren ${siren} et l'année ${year}. Voulez-vous commencer une nouvelle déclaration et supprimer les données déjà enregistrées ?`;

const OWNER_ERROR = "Vous n'avez pas les droits sur ce Siren.";

export const CommencerForm = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { funnel, saveFunnel, resetFunnel, isEdit, setIsEdit } = useRepeqFunnelStore();
  const [isPending, startTransition] = useTransition();

  const ownership = session?.user.ownership ?? [];
  // 130025265
  // 504920166

  const schemaWithOwnedSiren = createSteps.commencer.superRefine((val, ctx) => {
    if (!ownership.includes(val.siren)) {
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
    formState: { errors, isValid },
  } = useForm<CommencerFormType>({
    mode: "onChange",
    resolver: zodResolver(schemaWithOwnedSiren),
    defaultValues: {
      siren: funnel?.siren,
      year: funnel?.year,
    },
  });

  console.log({ isPending, isValid, errors });

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

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormLayout>
          <Select
            label="Année au titre de laquelle les écarts de représentation sont calculés"
            state={errors.year && "error"}
            stateRelatedMessage={errors.year?.message}
            nativeSelectProps={{
              ...register("year", {
                valueAsNumber: true,
              }),
            }}
          >
            <option value="" disabled>
              Sélectionnez une année
            </option>
            {YEARS_REPEQ.sort()
              .reverse()
              .map(year => (
                <option value={year} key={`year-select-${year}`}>
                  {year}
                </option>
              ))}
          </Select>
          <Input
            label="Numéro Siren de l'entreprise"
            hintText="9 chiffres"
            state={errors.siren && "error"}
            stateRelatedMessage={errors.siren?.message}
            nativeInputProps={{
              placeholder: "Ex: 504920166, 403461742, 403696735",
              maxLength: 9,
              minLength: 9,
              autoComplete: "ownership",
              ...register("siren"),
            }}
          />
          <datalist id="ownership">
            {ownership.map(siren => (
              <option key={siren} value={siren} />
            ))}
          </datalist>
          <ClientAnimate>
            {errors.siren?.message === OWNER_ERROR && (
              <Alert
                title="Siren non associé"
                severity="warning"
                description={`Votre compte (${session?.user.email}) n'est pas rattaché au SIREN sélectionné. Si vous pensez qu'il s'agit d'une erreur, merci de vous rapprocher de MonComptePro afin de valider votre appartenance à cette entreprise.`}
              />
            )}
          </ClientAnimate>
          <ButtonsGroup
            inlineLayoutWhen="sm and up"
            buttons={[
              {
                children: "Réinitialiser",
                priority: "secondary",
                onClick: confirmReset,
                disabled: !funnel?.siren,
                type: "button",
              },
              {
                children: "Suivant",
                type: "submit",
                disabled: !isValid,
              },
            ]}
          />
        </FormLayout>
      </form>
    </>
  );
};
