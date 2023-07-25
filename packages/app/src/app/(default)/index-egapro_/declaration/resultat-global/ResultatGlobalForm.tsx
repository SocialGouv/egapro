"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Select from "@codegouvfr/react-dsfr/Select";
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
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = zodFr.object({
  mesures: z.string(),
  index: z.number(),
  points: z.number(),
  pointsCalculables: z.number(),
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
  const [populationFavorableDisabled, setPopulationFavorableDisabled] = useState<boolean>();

  const methods = useForm<FormType>({
    shouldUnregister: true,
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      // console.debug("formData", data);
      console.debug("validation result", await zodResolver(formSchema)(data, context, options));
      return zodResolver(formSchema)(data, context, options);
    },
    mode: "onChange",
    defaultValues: formData[stepName],
  });

  const index = formData[stepName]?.index;
  const points = formData[stepName]?.points;
  const pointsCalculables = formData[stepName]?.pointsCalculables;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isValid, errors },
    watch,
  } = methods;

  console.log("errors:", errors);

  const onSubmit = async (data: FormType) => {
    const newFormData = produce(formData, draft => {
      draft[stepName] = data as DeclarationFormState[typeof stepName];
    });

    saveFormData(newFormData);

    router.push(funnelConfig(newFormData)[stepName].next().url);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* <ReactHookFormDebug /> */}

        <div ref={animationParent}>
          <ClientOnly fallback={<SkeletonForm fields={2} />}>
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
                      <option value={value} key={key}>
                        {value}
                      </option>
                    ))}
                  </Select>
                )}
              </>
            )}
          </ClientOnly>

          <Alert
            severity="info"
            description="Dès lors que l'index est inférieur à 75 points, des mesures adéquates et pertinentes de correction doivent être définies par accord ou, à défaut, par décision unilatérale après consultation du comité social et économique."
            small={false}
            title=""
          />
          <BackNextButtons stepName={stepName} disabled={!isValid} />
        </div>
      </form>
    </FormProvider>
  );
};
