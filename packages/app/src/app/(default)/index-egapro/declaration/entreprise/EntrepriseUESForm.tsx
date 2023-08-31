"use client";

import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { zodFr } from "@common/utils/zod";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { FormLayout } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { produce } from "immer";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { assertOrRedirectCommencerStep, funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = zodFr.object({
  type: z.string(), // No extra control needed because this is a radio button with options we provide.
  tranche: z.string(), // No extra control needed because this is a radio button with options we provide.
});

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

const stepName: FunnelKey = "entreprise";

export const EntrepriseUESForm = () => {
  const { formData, saveFormData } = useDeclarationFormManager();
  const router = useRouter();

  assertOrRedirectCommencerStep(formData);

  const {
    register,
    handleSubmit,
    watch,
    formState: { isValid },
  } = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: formData[stepName],
  });

  const type = watch("type");

  const onSubmit = async (data: FormType) => {
    const newFormData = produce(formData, draft => {
      draft[stepName] = data as DeclarationFormState[typeof stepName];

      if (data.type === "entreprise") {
        delete draft.ues;
      }

      // Preserve entrepriseDeclarante which is supposed to be entered in commencer page.
      if (draft[stepName] && formData.entreprise?.entrepriseDéclarante) {
        draft[stepName].entrepriseDéclarante = formData.entreprise.entrepriseDéclarante;
      }
    });

    saveFormData(newFormData);

    router.push(funnelConfig(newFormData).entreprise.next().url);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormLayout>
        <ClientAnimate>
          <RadioButtons
            legend="Vous déclarez votre index en tant que"
            options={[
              {
                label: "Entreprise",
                nativeInputProps: {
                  value: "entreprise",
                  ...register("type"),
                },
              },
              {
                label: "Unité Économique et Sociale (UES)",
                nativeInputProps: {
                  value: "ues",
                  ...register("type"),
                },
              },
            ]}
            orientation="horizontal"
          />

          <ClientOnly fallback={<SkeletonForm fields={2} />}>
            <RadioButtons
              legend={`Tranche d'effectifs assujettis de l'${type === "ues" ? "UES" : "entreprise"}`}
              options={[
                {
                  label: "De 50 à 250 inclus",
                  nativeInputProps: {
                    value: "50:250",
                    ...register("tranche"),
                  },
                },
                {
                  label: "De 251 à 999 inclus",
                  nativeInputProps: {
                    value: "251:999",
                    ...register("tranche"),
                  },
                },
                {
                  label: "De 1000 à plus",
                  nativeInputProps: {
                    value: "1000:",
                    ...register("tranche"),
                  },
                },
              ]}
            />
          </ClientOnly>

          <BackNextButtons stepName={stepName} disabled={!isValid} />
        </ClientAnimate>
      </FormLayout>
    </form>
  );
};
