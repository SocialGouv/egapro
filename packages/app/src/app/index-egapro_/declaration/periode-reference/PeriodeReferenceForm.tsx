"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { config } from "@common/config";
import { zodDateSchema, zodRadioInputSchema } from "@common/utils/form";
import { ClientOnly } from "@components/ClientOnly";
import { RadioOuiNon } from "@components/next13/RadioOuiNon";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { endOfYear, formatISO, getYear } from "date-fns";
import { pick } from "lodash";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z
  .object({
    annéeIndicateurs: z.number(), // No need to control the values, since it not saved but useful for zod validation.
    finPériodeRéférence: zodDateSchema,
    effectifTotal: z.number().positive().int(),
    périodeSuffisante: zodRadioInputSchema,
  })
  .superRefine(({ annéeIndicateurs, finPériodeRéférence: finPériode }, ctx) => {
    if (getYear(new Date(finPériode)) !== Number(annéeIndicateurs)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "L'année de la date de fin de la période doit correspondre à l'année au titre de laquelle les écarts de représentation sont calculés",
        path: ["finPériode"],
      });
    }
  });

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

/**
 * The shape of data depends of some conditions on fields. We ensure to always have the correct shape depending on the context.
 */
const formatData = (data: FormType): DeclarationFormState["périodeRéférence"] => {
  if (data.périodeSuffisante === "non") {
    return pick(data, "périodeSuffisante") as DeclarationFormState["périodeRéférence"]; // To fix TS pick incorrect guess. In this case, périodeSuffisante is always "non", and is a correct type.
  } else {
    return pick(
      { ...data, effectifTotal: data.effectifTotal },
      "périodeSuffisante",
      "finPériodeRéférence",
      "effectifTotal",
    );
  }
};

export const PeriodeReferenceForm = () => {
  const { formData, savePageData } = useDeclarationFormManager();
  const router = useRouter();

  const methods = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...formData.commencer, ...formData.périodeRéférence },
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
    savePageData("périodeRéférence", formatData(data));

    router.push(`${config.base_declaration_url}/remuneration`);
  };

  console.log("errors", errors);

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
                state={errors.finPériodeRéférence ? "error" : "default"}
                stateRelatedMessage={errors.finPériodeRéférence?.message}
              />
              <Button className={fr.cx("fr-mb-4w")} onClick={() => selectEndOfYear()}>
                Sélectionner la fin de l'année civile
              </Button>
              <Input
                label="Nombre de salariés pris en compte pour le calcul des indicateurs sur la période de référence (en effectif physique)"
                nativeInputProps={{
                  type: "number",
                  min: 1,
                  ...register("effectifTotal", { valueAsNumber: true }),
                }}
                state={errors.effectifTotal ? "error" : "default"}
                stateRelatedMessage={errors.effectifTotal?.message}
              />
            </>
          )}
        </ClientOnly>

        <ButtonsGroup
          inlineLayoutWhen="sm and up"
          buttons={[
            {
              children: "Précédent",
              priority: "secondary",
              onClick: () => router.push(`${config.base_declaration_url}/entreprise`),
              type: "button",
            },
            {
              children: "Suivant",
              type: "submit",
              nativeButtonProps: {
                disabled: !isValid,
              },
            },
          ]}
        />
      </form>
    </FormProvider>
  );
};
