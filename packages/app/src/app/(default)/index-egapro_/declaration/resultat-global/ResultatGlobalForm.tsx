"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { indicatorNoteMax } from "@common/core-domain/domain/valueObjects/declaration/indicators/IndicatorThreshold";
import { zodFr } from "@common/utils/zod";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { IndicatorNote } from "@design-system";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { produce } from "immer";
import { get } from "lodash";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = zodFr.object({
  mesure: z.string(),
  note: z.number().int().min(0).max(100),
});

type FormType = z.infer<typeof formSchema>;

const stepName: FunnelKey = "resultat-global";

const mesuresLabel = {
  mmo: "Mesures mises en oeuvre",
  me: "Mesures envisagées&mne=Mesures non envisagées",
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

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isValid, errors },
    watch,
  } = methods;

  useEffect(() => {
    register("note");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const note = watch("note");

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
            <>
              <IndicatorNote note={74} max={100} text="Index de" className={fr.cx("fr-mt-2w")} />
              {note < 75 && (
                <Select
                  label="Mesures de correction prévues à l'article D. 1142-6"
                  state={errors.mesure && "error"}
                  stateRelatedMessage={errors.mesure?.message}
                  nativeSelectProps={{
                    ...register("mesure"),
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
              <Input
                label="Mesures de correction prévues à l'article D. 1142-6"
                nativeInputProps={{
                  type: "number",
                  min: 0,
                  max: 5,
                  step: 1,
                  ...register("résultat", {
                    valueAsNumber: true,
                    // setValueAs: (value: string) => {
                    //   // We implement our own valueAsNumber because valueAsNumber returns NaN for empty string and we want null instead.
                    //   const num = Number(value);
                    //   return isNaN(num) || value === "" ? null : num;
                    // },
                  }),
                }}
                state={get(errors, "résultat") ? "error" : "default"}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                stateRelatedMessage={get(errors, "résultat")?.message || ""}
              />
              <Alert
                severity="info"
                description="Dès lors que l'index est inférieur à 75 points, des mesures adéquates et pertinentes de correction doivent être définies par accord ou, à défaut, par décision unilatérale après consultation du comité social et économique."
              />{" "}
              {note !== undefined && (
                <>
                  <IndicatorNote
                    note={note}
                    max={indicatorNoteMax[stepName]}
                    text="Nombre de points obtenus à l'indicateur"
                    className={fr.cx("fr-mt-2w")}
                  />
                </>
              )}
            </>
          </ClientOnly>

          <BackNextButtons stepName={stepName} disabled={!isValid} />
        </div>
      </form>
    </FormProvider>
  );
};
