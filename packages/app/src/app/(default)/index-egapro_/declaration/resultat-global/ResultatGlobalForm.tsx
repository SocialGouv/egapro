"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Select from "@codegouvfr/react-dsfr/Select";
import { computeIndex } from "@common/core-domain/domain/valueObjects/declaration/indicators/IndicatorThreshold";
import { zodFr } from "@common/utils/zod";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { IndicatorNote } from "@design-system";
import { useAutoAnimate } from "@formkit/auto-animate/react";
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

const mesuresLabel = {
  mmo: "Mesures mises en oeuvre",
  me: "Mesures envisagées",
  mne: "Mesures non envisagées",
};

export const ResultatGlobalForm = () => {
  const router = useRouter();
  const [animationParent] = useAutoAnimate();
  const { formData, saveFormData } = useDeclarationFormManager();

  // We don't compute the index if we only read an existing declaration.
  const defaultValues =
    formData["declaration-existante"].status === "consultation"
      ? formData[stepName]
      : { ...formData[stepName], ...computeIndex(formData) };

  const methods = useForm<FormType>({
    shouldUnregister: true,
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      // console.debug("formData", data);
      console.debug("validation result", await zodResolver(formSchema)(data, context, options));
      return zodResolver(formSchema)(data, context, options);
    },
    defaultValues,
  });

  const index = formData[stepName]?.index;
  const points = formData[stepName]?.points;
  const pointsCalculables = formData[stepName]?.pointsCalculables;

  const {
    register,
    handleSubmit,
    formState: { isValid, errors },
  } = methods;

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
        {/* <ReactHookFormDebug /> */}

        <div ref={animationParent}>
          <ClientOnly fallback={<SkeletonForm fields={2} />}>
            {index == undefined && (
              <>
                <p>Non calculable </p>
                Total des points obtenus aux indicateurs calculables : {points}
                <br />
                Nombre de points maximum pouvant être obtenus aux indicateurs calculables : {pointsCalculables}
              </>
            )}

            {index !== undefined && (
              <>
                <IndicatorNote
                  note={index}
                  max={100}
                  text="Index de"
                  className={fr.cx("fr-mb-2w")}
                  legend={
                    <>
                      Total des points obtenus aux indicateurs calculables : {points}
                      <br />
                      Nombre de points maximum pouvant être obtenus aux indicateurs calculables : {pointsCalculables}
                    </>
                  }
                />
                {index < 75 && (
                  <>
                    <Select
                      label="Mesures de correction prévues à l'article D. 1142-6"
                      state={errors.mesures && "error"}
                      stateRelatedMessage={errors.mesures?.message}
                      nativeSelectProps={{
                        ...register("mesures"),
                      }}
                    >
                      <option value="" disabled>
                        Sélectionnez une mesure
                      </option>
                      {Object.entries(mesuresLabel).map(([key, value]) => (
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
              </>
            )}
          </ClientOnly>

          <BackNextButtons stepName={stepName} disabled={!isValid} />
        </div>
      </form>
    </FormProvider>
  );
};
