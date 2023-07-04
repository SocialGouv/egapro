"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodDateSchema, zodRealPositiveIntegerSchema } from "@common/utils/form";
import { RadioOuiNon } from "@components/RHF/RadioOuiNon";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { endOfYear, formatISO, getYear } from "date-fns";
import { omit } from "lodash";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = z
  .object({
    périodeSuffisante: z.literal("oui"),
    annéeIndicateurs: z.number(),
    finPériodeRéférence: zodDateSchema,
    effectifTotal: zodRealPositiveIntegerSchema,
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

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

const stepName: FunnelKey = "periode-reference";

export const PeriodeReferenceForm = () => {
  const { formData, savePageData } = useDeclarationFormManager();
  const router = useRouter();

  const methods = useForm<FormType>({
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

  const périodeSuffisante = watch("périodeSuffisante");

  const onSubmit = async (data: FormType) => {
    savePageData(stepName, data.périodeSuffisante === "oui" ? omit(data, "annéeIndicateurs") : data);

    router.push(funnelConfig(formData)[stepName].next().url);
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

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* <ReactHookFormDebug /> */}

        <Input
          label="Année au titre de laquelle les indicateurs sont calculés"
          nativeInputProps={{
            title: "Saisissez le nom ou le Siren d'une entreprise",
            readOnly: true,
            ...register("annéeIndicateurs", { valueAsNumber: true }),
          }}
        />

        <RadioOuiNon
          legend="Disposez-vous d'une période de référence de 12 mois consécutifs pour le calcul de vos indicateurs ?"
          name="périodeSuffisante"
        />

        <ClientOnly fallback={<SkeletonForm fields={2} />}>
          {périodeSuffisante === "oui" && (
            <>
              <Input
                label="Date de fin de la période de référence choisie pour le calcul des indicateurs"
                nativeInputProps={{
                  type: "date",
                  ...register("finPériodeRéférence"),
                }}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore -- finPériodeRéférence is present if périodeSuffisante is "oui"
                state={errors.finPériodeRéférence ? "error" : "default"}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore -- finPériodeRéférence is present if périodeSuffisante is "oui"
                stateRelatedMessage={errors.finPériodeRéférence?.message}
              />
              <Button type="button" className={fr.cx("fr-mb-4w")} onClick={() => selectEndOfYear()}>
                Sélectionner la fin de l'année civile
              </Button>
              <Input
                label="Nombre de salariés pris en compte pour le calcul des indicateurs sur la période de référence (en effectif physique)"
                nativeInputProps={{
                  type: "number",
                  min: 1,
                  ...register("effectifTotal", { valueAsNumber: true }),
                }}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore -- effectifTotal is present if périodeSuffisante is "oui"
                state={errors.effectifTotal ? "error" : "default"}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore -- effectifTotal is present if périodeSuffisante is "oui"
                stateRelatedMessage={errors.effectifTotal?.message}
              />
            </>
          )}
        </ClientOnly>

        <BackNextButtons stepName="periode-reference" disabled={!isValid} />
      </form>
    </FormProvider>
  );
};
