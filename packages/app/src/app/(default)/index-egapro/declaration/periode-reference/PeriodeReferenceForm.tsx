"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Highlight from "@codegouvfr/react-dsfr/Highlight";
import Input from "@codegouvfr/react-dsfr/Input";
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { zodDateSchema, zodPositiveOrZeroIntegerSchema } from "@common/utils/form";
import { zodFr } from "@common/utils/zod";
import { RadioOuiNon } from "@components/RHF/RadioOuiNon";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { Skeleton } from "@design-system/utils/client/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { endOfYear, formatISO, getYear } from "date-fns";
import { produce } from "immer";
import { omit } from "lodash";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { type FieldErrors, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { assertOrRedirectCommencerStep, funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = zodFr
  .object({
    périodeSuffisante: z.literal("oui"),
    annéeIndicateurs: z.number(),
    finPériodeRéférence: zodDateSchema,
    effectifTotal: zodPositiveOrZeroIntegerSchema,
  })
  .superRefine(({ annéeIndicateurs, finPériodeRéférence }, ctx) => {
    if (getYear(new Date(finPériodeRéférence)) !== annéeIndicateurs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "L'année de la date de fin de la période doit correspondre à l'année au titre de laquelle les écarts de représentation sont calculés",
        path: ["finPériodeRéférence"],
      });
    }
  })
  .or(
    z.object({
      périodeSuffisante: z.literal("non"),
    }),
  );

type FormType = z.infer<typeof formSchema>;
type FormTypeWhenPeriode = Extract<FormType, { périodeSuffisante: "oui" }>;

const stepName: FunnelKey = "periode-reference";

export const PeriodeReferenceForm = () => {
  const router = useRouter();
  const { formData, saveFormData } = useDeclarationFormManager();

  assertOrRedirectCommencerStep(formData);

  const methods = useForm<FormType>({
    mode: "onChange",
    shouldUnregister: true, // Don't store the fields that are not displayed.
    resolver: zodResolver(formSchema),
    defaultValues: { ...formData.commencer, ...formData[stepName] },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = methods;

  useEffect(() => {
    register("annéeIndicateurs");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const périodeSuffisante = watch("périodeSuffisante");
  const year = watch("annéeIndicateurs");

  const onSubmit = async (data: FormType) => {
    const newFormData = produce(formData, draft => {
      const stepData = data.périodeSuffisante === "oui" ? omit(data, "annéeIndicateurs") : data;

      // We clean potential data for some pages after in the flow.
      if (data.périodeSuffisante === "non") {
        draft["remunerations"] = undefined;
        draft["remunerations-coefficient-autre"] = undefined;
        draft["remunerations-coefficient-branche"] = undefined;
        draft["remunerations-csp"] = undefined;
        draft["remunerations-resultat"] = undefined;
        draft["resultat-global"] = undefined;
        draft["augmentations-et-promotions"] = undefined;
        draft["augmentations"] = undefined;
        draft["promotions"] = undefined;
        draft["conges-maternite"] = undefined;
        draft["hautes-remunerations"] = undefined;
        draft["publication"] = undefined;
      }

      draft[stepName] = stepData as DeclarationDTO[typeof stepName];
    });

    saveFormData(newFormData);

    router.push(funnelConfig(newFormData)[stepName].next().url);
  };

  const selectEndOfYear = () => {
    if (formData?.commencer?.annéeIndicateurs) {
      setValue(
        "finPériodeRéférence",
        formatISO(endOfYear(new Date().setFullYear(formData?.commencer.annéeIndicateurs)), { representation: "date" }),
        { shouldDirty: true, shouldValidate: true },
      );
    }
  };

  const errorsWhenPeriode = errors as FieldErrors<FormTypeWhenPeriode>;

  return (
    <FormProvider {...methods}>
      <Highlight className="fr-ml-0" size="lg">
        <u>
          <strong>
            <ClientOnly fallback={<Skeleton inline width="4ch" />}>{year}</ClientOnly>
          </strong>
        </u>{" "}
        est l'année au titre de laquelle les indicateurs sont calculés.
      </Highlight>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <p className="fr-text--xs">Les champs suivis d'une * sont obligatoires</p>
        <ClientAnimate>
          <RadioOuiNon
            legend="Disposez-vous d'une période de référence de 12 mois consécutifs pour le calcul de vos indicateurs ? *"
            name="périodeSuffisante"
          />

          <ClientOnly fallback={<SkeletonForm fields={2} />}>
            {périodeSuffisante === "oui" && (
              <>
                <Input
                  label="Date de fin de la période de référence choisie pour le calcul des indicateurs *"
                  nativeInputProps={{
                    type: "date",
                    min: `${year}-01-01`,
                    max: `${year}-12-31`,
                    ...register("finPériodeRéférence"),
                  }}
                  state={errorsWhenPeriode.finPériodeRéférence && "error"}
                  stateRelatedMessage={errorsWhenPeriode.finPériodeRéférence?.message}
                />
                <Button
                  type="button"
                  size="small"
                  priority="secondary"
                  className={fr.cx("fr-mb-4w", "fr-mt-0")}
                  onClick={selectEndOfYear}
                >
                  Sélectionner la fin de l'année civile
                </Button>
                <Input
                  label="Nombre de salariés pris en compte pour le calcul des indicateurs sur la période de référence (en effectif physique) *"
                  nativeInputProps={{
                    type: "number",
                    min: 1,
                    step: 1,
                    ...register("effectifTotal", { valueAsNumber: true }),
                  }}
                  state={errorsWhenPeriode.effectifTotal && "error"}
                  stateRelatedMessage={errorsWhenPeriode.effectifTotal?.message}
                />
              </>
            )}
          </ClientOnly>

          <BackNextButtons stepName="periode-reference" disabled={!isValid} />
        </ClientAnimate>
      </form>
    </FormProvider>
  );
};
