"use client";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { createSteps } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { REGEX_URL } from "@common/shared-domain/domain/valueObjects";
import { formatIsoToFr } from "@common/utils/date";
import { type ClearObject, type UnionToIntersection } from "@common/utils/types";
import { storePicker } from "@common/utils/zustand";
import { FormLayout } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { isBefore, parseISO } from "date-fns";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "../useRepeqFunnelStore";

const formSchema = createSteps.publication
  .and(createSteps.periodeReference)
  .superRefine(({ endOfPeriod, publishDate }, ctx) => {
    if (!publishDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La date de publication est obligatoire",
        path: ["publishDate"],
      });

      return z.NEVER;
    }
    if (isBefore(parseISO(publishDate), parseISO(endOfPeriod))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `La date de publication ne peut précéder la date de fin de la période de référence (${formatIsoToFr(
          endOfPeriod,
        )})`,
        path: ["publishDate"],
      });
    }
  });
type PublicationFormType = ClearObject<UnionToIntersection<z.infer<typeof formSchema>>>;

const useStore = storePicker(useRepeqFunnelStore);
export const PublicationForm = () => {
  const router = useRouter();
  const [hasWebsite, setHasWebsite] = useState<boolean>();
  const [previousUrl, setPreviousUrl] = useState<string>();
  const [previousModalities, setPreviousModalities] = useState<string>();
  const [funnel, saveFunnel, resetFunnel] = useStore("funnel", "saveFunnel", "resetFunnel");
  const hydrated = useRepeqFunnelStoreHasHydrated();

  const {
    formState: { errors, isValid },
    handleSubmit,
    register,
    resetField,
    getValues,
  } = useForm<PublicationFormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: funnel,
  });

  useEffect(() => {
    if (!funnel?.endOfPeriod) redirect("/representation-equilibree/commencer");

    if ("publishUrl" in funnel) {
      setHasWebsite(true);
    } else if ("publishModalities" in funnel) {
      setHasWebsite(false);
    }
  }, [funnel]);

  const onSubmit = async (data: PublicationFormType) => {
    if (!funnel) return;

    if (hasWebsite) {
      const { publishModalities: _, ...rest } = funnel as PublicationFormType;
      resetFunnel();
      saveFunnel({ ...rest, ...data });
    } else {
      const { publishUrl: _, ...rest } = funnel as PublicationFormType;
      resetFunnel();
      saveFunnel({ ...rest, ...data });
    }
    router.push("/representation-equilibree/validation");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormLayout>
        <Input
          label="Date de publication des écarts calculables"
          state={errors.publishDate && "error"}
          stateRelatedMessage={errors.publishDate?.message}
          nativeInputProps={{
            type: "date",
            placeholder: "Sélectionner une date",
            min: hydrated ? funnel?.endOfPeriod : void 0,
            ...register("publishDate"),
          }}
        />

        <RadioButtons
          legend="Avez-vous un site Internet pour publier les écarts calculables ?"
          orientation="horizontal"
          options={[
            {
              label: "Oui",
              nativeInputProps: {
                defaultChecked: hasWebsite,
                onChange() {
                  setHasWebsite(true);
                  setPreviousModalities(getValues("publishModalities"));
                  resetField("publishModalities");
                  resetField("publishUrl", { defaultValue: previousUrl });
                },
              },
            },
            {
              label: "Non",
              nativeInputProps: {
                defaultChecked: hasWebsite === false,
                onChange() {
                  setHasWebsite(false);
                  setPreviousUrl(getValues("publishUrl"));
                  resetField("publishUrl");
                  resetField("publishModalities", { defaultValue: previousModalities });
                },
              },
            },
          ]}
        />
        <Input
          label="Adresse exacte de la page Internet (URL)"
          state={errors.publishUrl && "error"}
          stateRelatedMessage={errors.publishUrl?.message}
          style={{ display: hasWebsite ? "block" : "none" }}
          nativeInputProps={{
            placeholder: "https://",
            type: "url",
            pattern: REGEX_URL.source,
            ...register("publishUrl", {
              disabled: hasWebsite === false,
            }),
          }}
        />
        <Input
          textArea
          label="Modalités de communication"
          state={errors.publishModalities && "error"}
          stateRelatedMessage={errors.publishModalities?.message}
          style={{ display: hasWebsite === false ? "block" : "none" }}
          nativeTextAreaProps={{
            ...register("publishModalities", { disabled: hasWebsite }),
          }}
        />
        <ButtonsGroup
          inlineLayoutWhen="sm and up"
          buttons={[
            {
              children: "Précédent",
              linkProps: {
                href: "/representation-equilibree/ecarts-membres",
              },
              priority: "secondary",
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
  );
};
