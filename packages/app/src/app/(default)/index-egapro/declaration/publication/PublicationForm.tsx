"use client";

import Input from "@codegouvfr/react-dsfr/Input";
import { Url } from "@common/shared-domain/domain/valueObjects";
import { formatIsoToFr } from "@common/utils/date";
import { zodDateSchema, zodRadioInputSchema } from "@common/utils/form";
import { zodFr, zodValueObjectSuperRefine } from "@common/utils/zod";
import { RadioOuiNon } from "@components/RHF/RadioOuiNon";
import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { isBefore, parseISO } from "date-fns";
import { produce } from "immer";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { BackNextButtons } from "../BackNextButtons";
import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";

const formSchema = zodFr.object({
  choixSiteWeb: zodRadioInputSchema,
  date: zodDateSchema,
  url: z
    .string()
    .trim()
    .nonempty("L'adresse exacte de la page internet est obligatoire")
    .superRefine(zodValueObjectSuperRefine(Url, "L'adresse de la page internet est invalide"))
    .optional(),
  modalités: z
    .string()
    .trim()
    .nonempty("La description des modalités de communication des écarts est obligatoire")
    .optional(),
  planRelance: zodRadioInputSchema,
});

type FormType = z.infer<typeof formSchema>;

const stepName: FunnelKey = "publication";

export const PublicationForm = () => {
  const router = useRouter();
  const { formData, saveFormData } = useDeclarationFormManager();

  funnelConfig(formData)[stepName].validateStep?.();

  // asserted by validateStep
  const referencePeriod = formData["periode-reference"] as Exclude<
    DeclarationFormState["periode-reference"],
    | {
        périodeSuffisante: "non";
      }
    | undefined
  >;

  const methods = useForm<FormType>({
    mode: "onChange",
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: formData[stepName],
  });

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setError,
    formState: { isValid, errors },
  } = methods;

  const endOfPeriod = referencePeriod.finPériodeRéférence;
  const choixSiteWeb = watch("choixSiteWeb");

  const onSubmit = async (data: FormType) => {
    if (isBefore(parseISO(data.date), parseISO(endOfPeriod))) {
      return setError("date", {
        type: "manual",
        message: `La date de publication ne peut précéder la date de fin de la période de référence (${formatIsoToFr(
          endOfPeriod,
        )})`,
      });
    }

    const newFormData = produce(formData, draft => {
      draft[stepName] = data as DeclarationFormState[typeof stepName];
    });

    saveFormData(newFormData);

    router.push(funnelConfig(newFormData)[stepName].next().url);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ClientAnimate>
          <ClientOnly fallback={<SkeletonForm fields={2} />}>
            <Input
              label="Date de publication des résultats obtenus"
              nativeInputProps={{
                ...register("date"),
                type: "date",
                min: endOfPeriod,
              }}
              state={errors.date && "error"}
              stateRelatedMessage={errors.date?.message}
            />

            <RadioOuiNon name="choixSiteWeb" legend="Avez-vous un site Internet pour publier les résultats obtenus ?" />

            {choixSiteWeb === "oui" && (
              <Input
                label="Indiquer l'adresse exacte de la page Internet (URL) sur laquelle seront publiés les résultats obtenus"
                nativeInputProps={{
                  ...register("url"),
                  type: "url",
                  onBlur: () => trigger("url"),
                }}
                state={errors.url && "error"}
                stateRelatedMessage={errors.url?.message}
              />
            )}
            {choixSiteWeb === "non" && (
              <Input
                label="Préciser les modalités de communication des résultats obtenus auprès de vos salariés"
                textArea
                state={errors.modalités && "error"}
                stateRelatedMessage={errors.modalités?.message}
                nativeTextAreaProps={register("modalités")}
              />
            )}

            <RadioOuiNon
              name="planRelance"
              legend={
                formData.entreprise?.type === "ues"
                  ? "Une ou plusieurs entreprises comprenant au moins 50 salariés au sein de l'UES a-t-elle bénéficié, depuis 2021, d'une aide prévue par la loi du 29 décembre 2020 de finances pour 2021 au titre de la mission « Plan de relance » ?"
                  : "Avez-vous bénéficié, depuis 2021, d'une aide prévue par la loi du 29 décembre 2020 de finances pour 2021 au titre de la mission « Plan de relance » ?"
              }
            />
          </ClientOnly>

          <BackNextButtons stepName={stepName} disabled={!isValid} />
        </ClientAnimate>
      </form>
    </FormProvider>
  );
};
