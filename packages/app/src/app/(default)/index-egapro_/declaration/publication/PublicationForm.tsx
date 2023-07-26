"use client";

import Input from "@codegouvfr/react-dsfr/Input";
import { zodDateSchema, zodRadioInputSchema } from "@common/utils/form";
import { zodFr } from "@common/utils/zod";
import { RadioOuiNon } from "@components/RHF/RadioOuiNon";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { produce } from "immer";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = zodFr.object({
  choixSiteWeb: zodRadioInputSchema,
  date: zodDateSchema,
  url: z.string().url().optional(),
  modalités: z.string().optional(),
  planRelance: zodRadioInputSchema,
});

type FormType = z.infer<typeof formSchema>;

const stepName: FunnelKey = "publication";

export const PublicationForm = () => {
  const router = useRouter();
  const [animationParent] = useAutoAnimate();
  const { formData, saveFormData } = useDeclarationFormManager();

  const methods = useForm<FormType>({
    shouldUnregister: true,
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      // console.debug("formData", data);
      console.debug("validation result", await zodResolver(formSchema)(data, context, options));
      return zodResolver(formSchema)(data, context, options);
    },
    defaultValues: formData[stepName],
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { isValid, errors },
  } = methods;

  const choixSiteWeb = watch("choixSiteWeb");

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
              <Input
                label="Date de publication des résultats obtenus"
                nativeInputProps={{
                  type: "date",
                  ...register("date"),
                }}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore -- finPériodeRéférence is present if périodeSuffisante is "oui"
                state={errors.date ? "error" : "default"}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                stateRelatedMessage={errors.date?.message}
              />
            </>

            <RadioOuiNon name="choixSiteWeb" legend="Avez-vous un site Internet pour publier les résultats obtenus ?" />

            {choixSiteWeb === "oui" && (
              <Input
                label="Indiquer l'adresse exacte de la page Internet (URL) sur laquelle seront publiés les résultats obtenus"
                nativeInputProps={{ ...register("url"), type: "url" }}
              />
            )}
            {choixSiteWeb === "non" && (
              <Input
                label="Préciser les modalités de communication des résultats obtenus auprès de vos salariés"
                textArea
                stateRelatedMessage={errors.modalités?.message}
                nativeTextAreaProps={{ ...register("modalités") }}
              />
            )}

            <RadioOuiNon
              name="planRelance"
              legend="Avez-vous bénéficié, depuis 2021, d'une aide prévue par la loi du 29 décembre 2020 de finances pour 2021
              au titre de la mission « Plan de relance » ?"
            />
          </ClientOnly>

          <BackNextButtons stepName={stepName} disabled={!isValid} />
        </div>
      </form>
    </FormProvider>
  );
};
