"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Select from "@codegouvfr/react-dsfr/Select";
import { CorrectiveMeasures } from "@common/core-domain/domain/valueObjects/declaration/declarationInfo/CorrectiveMeasures";
import { computeIndex } from "@common/core-domain/domain/valueObjects/declaration/indicators/IndicatorThreshold";
import { zodFr } from "@common/utils/zod";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BigNote } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { produce } from "immer";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = zodFr
  .object({
    mesures: z.string().optional(),
    index: z.number().optional(),
    points: z.number(),
    pointsCalculables: z.number(),
  })
  .superRefine(({ index, mesures }, ctx) => {
    if (index !== undefined && index < 75 && !mesures) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Les mesures de correction prévues à l'article D. 1142-6 sont obligatoires quand l'index est inférieur à 75 points",
        path: ["mesures"],
      });
    }
  });

type FormType = z.infer<typeof formSchema>;

const stepName: FunnelKey = "resultat-global";

export const ResultatGlobalForm = () => {
  const router = useRouter();
  const { formData, saveFormData } = useDeclarationFormManager();

  funnelConfig(formData)[stepName].validateStep?.();

  // We don't compute the index if we only read an existing declaration.
  const defaultValues =
    formData["declaration-existante"].status === "consultation"
      ? formData[stepName]
      : { ...formData[stepName], ...computeIndex(formData) };

  const methods = useForm<FormType>({
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { isValid, errors },
  } = methods;

  const index = watch("index");
  const points = watch("points");
  const pointsCalculables = watch("pointsCalculables");

  const onSubmit = async (data: FormType) => {
    const newFormData = produce(formData, draft => {
      draft[stepName] = data as DeclarationFormState[typeof stepName];
    });

    saveFormData(newFormData);

    router.push(funnelConfig(newFormData)[stepName].next().url);
  };

  useEffect(() => {
    register("index");
    register("points");
    register("pointsCalculables");
  }, []);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ClientAnimate>
          <ClientOnly fallback={<SkeletonForm fields={2} />}>
            <BigNote
              className={fr.cx("fr-mb-4w")}
              note={index}
              max={100}
              legend={index !== undefined ? "Index de" : "Index non calculable"}
              text={
                <>
                  <p>
                    Total des points obtenus aux indicateurs calculables&nbsp;: <strong>{points}</strong>
                  </p>
                  <p>
                    Nombre de points maximum pouvant être obtenus aux indicateurs calculables&nbsp;:{" "}
                    <strong>{pointsCalculables}</strong>
                  </p>
                </>
              }
            />

            {index !== undefined && index < 75 && (
              <>
                <Select
                  label="Mesures de correction prévues à l'article D. 1142-6"
                  state={errors.mesures && "error"}
                  stateRelatedMessage={errors.mesures?.message}
                  nativeSelectProps={{
                    ...register("mesures"),
                  }}
                >
                  <option value="" hidden>
                    Sélectionnez une mesure
                  </option>
                  {Object.entries(CorrectiveMeasures.Label).map(([key, value]) => (
                    <option value={key} key={key}>
                      {value}
                    </option>
                  ))}
                </Select>
                <Alert
                  severity="info"
                  description="Dès lors que l'index est inférieur à 75 points, des mesures adéquates et pertinentes de correction doivent être définies par accord ou, à défaut, par décision unilatérale après consultation du comité social et économique."
                  small={false}
                  title=""
                />
              </>
            )}
          </ClientOnly>

          <BackNextButtons stepName={stepName} disabled={!isValid} />
        </ClientAnimate>
      </form>
    </FormProvider>
  );
};
