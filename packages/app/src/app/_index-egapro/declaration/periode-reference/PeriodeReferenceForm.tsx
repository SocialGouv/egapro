"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { config } from "@common/config";
import { zodDateSchema, zodPositiveIntegerSchema, zodRadioInputSchema } from "@common/utils/form";
import { RadioOuiNon } from "@components/next13/RadioOuiNon";
import { ButtonAsLink } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { endOfYear, formatISO, getYear } from "date-fns";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z
  .object({
    annéeIndicateurs: z.number(),
    finPériode: zodDateSchema,
    nbSalariés: zodPositiveIntegerSchema,
    périodeSuffisante: zodRadioInputSchema,
  })
  .superRefine(({ annéeIndicateurs, finPériode }, ctx) => {
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

export const PeriodeReferenceForm = () => {
  const { formData, savePageData } = useDeclarationFormManager();
  const router = useRouter();

  const methods = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      annéeIndicateurs: formData.commencer?.année,
      finPériode:
        formData.période_référence?.périodeSuffisante === "oui" && formData?.période_référence?.finPériode
          ? formData.période_référence.finPériode
          : "",
      nbSalariés:
        formData.période_référence?.périodeSuffisante === "oui" && formData.période_référence?.nbSalariés
          ? String(formData.période_référence?.nbSalariés)
          : "",
      périodeSuffisante: formData.période_référence?.périodeSuffisante,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = methods;

  const périodeSuffisante = watch("périodeSuffisante");

  const onSubmit = async (data: FormType) => {
    savePageData("période_référence", data as DeclarationFormState["période_référence"]);

    router.push(`${config.base_declaration_url}/remuneration`);
  };

  const selectEndOfYear = () => {
    if (formData?.commencer?.année) {
      setValue(
        "finPériode",
        formatISO(endOfYear(new Date().setFullYear(formData?.commencer.année)), { representation: "date" }),
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
            ...register("annéeIndicateurs"),
          }}
        />

        <RadioOuiNon
          legend="Disposez-vous d'une période de référence de 12 mois consécutifs pour le calcul de vos indicateurs ?"
          name="périodeSuffisante"
        />

        {périodeSuffisante === "oui" && (
          <>
            <Input
              label="Date de fin de la période de référence choisie pour le calcul des indicateurs"
              nativeInputProps={{
                type: "date",
                ...register("finPériode"),
              }}
              state={errors.finPériode ? "error" : "default"}
              stateRelatedMessage={errors.finPériode?.message}
            />
            <Button className={fr.cx("fr-mb-4w")} onClick={() => selectEndOfYear()}>
              Sélectionner la fin de l'année civile
            </Button>
            <Input
              label="Nombre de salariés pris en compte pour le calcul des indicateurs sur la période de référence (en effectif physique)"
              nativeInputProps={{
                type: "number",
                min: 1,
                ...register("nbSalariés"),
              }}
              state={errors.nbSalariés ? "error" : "default"}
              stateRelatedMessage={errors.nbSalariés?.message}
            />
          </>
        )}
        <div style={{ display: "flex", gap: 10 }} className={fr.cx("fr-mt-4w")}>
          <ButtonAsLink href={`${config.base_declaration_url}/entreprise`} variant="secondary">
            Précédent
          </ButtonAsLink>

          <Button>Suivant</Button>
        </div>
      </form>
    </FormProvider>
  );
};
