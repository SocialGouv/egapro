"use client";

import { fr } from "@codegouvfr/react-dsfr";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { config } from "@common/config";
import { zodRealPositiveIntegerSchema } from "@common/utils/form";
import { ClientOnly } from "@components/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { get } from "lodash";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  catégories: z.array(
    z.object({
      nom: z.string(),
      tranches: z.object({
        ":29": zodRealPositiveIntegerSchema,
        "30:39": zodRealPositiveIntegerSchema,
        "40:49": zodRealPositiveIntegerSchema,
        "50:": zodRealPositiveIntegerSchema,
      }),
    }),
  ),
});

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

// TODO: add an enum for the CSP
const labelCSP = {
  ouv: "Ouvriers",
  emp: "Employés",
  tam: "Techniciens et agents de maîtrise",
  ic: "Ingénieurs et cadres",
};

const defaultTranch = { ":29": 0, "30:39": 0, "40:49": 0, "50:": 0 };

const defaultCategoriesCSP = [
  { nom: "ouv", tranches: { ...defaultTranch } },
  { nom: "emp", tranches: { ...defaultTranch } },
  { nom: "tam", tranches: { ...defaultTranch } },
  { nom: "ic", tranches: { ...defaultTranch } },
];

export const RemunerationCSPForm = () => {
  const { formData, savePageData } = useDeclarationFormManager();
  const router = useRouter();

  const methods = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: formData.rémunérationsCSP || { catégories: defaultCategoriesCSP },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = methods;

  console.log("errors", errors);

  const catégories = watch("catégories");

  const onSubmit = async (data: FormType) => {
    savePageData("rémunérationsCSP", data as DeclarationFormState["rémunérationsCSP"]);
    router.push(`${config.base_declaration_url}/remuneration-resultat`);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ClientOnly fallback={<SkeletonForm fields={2} />}>
          {/* <ReactHookFormDebug /> */}

          {catégories.map((catégorie, index) => (
            <>
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore */}
              <h3>{labelCSP[catégorie.nom]}</h3>
              <table key={catégorie.nom} className={fr.cx("fr-mb-4w")}>
                <thead>
                  <tr>
                    <th>% moins de 30 ans</th>
                    <th>% de 30 à 39 ans</th>
                    <th>% de 40 à 49 ans</th>
                    <th>% 50 ans et plus</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <Input
                        label=""
                        nativeInputProps={{
                          type: "number",
                          min: 0,
                          ...register(`catégories.${index}.tranches.:29`, { valueAsNumber: true }),
                        }}
                        state={get(errors, `catégories.${index}.tranches.:29`) ? "error" : "default"}
                        stateRelatedMessage={
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          // @ts-ignore
                          get(errors, `catégories.${index}.tranches.:29`)?.message
                        }
                      />
                    </td>
                    <td>
                      <Input
                        label=""
                        nativeInputProps={{
                          type: "number",
                          min: 0,
                          ...register(`catégories.${index}.tranches.30:39`, { valueAsNumber: true }),
                        }}
                        state={get(errors, `catégories.${index}.tranches.30:39`) ? "error" : "default"}
                        stateRelatedMessage={
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          // @ts-ignore
                          get(errors, `catégories.${index}.tranches.30:39`)?.message
                        }
                      />
                    </td>
                    <td>
                      <Input
                        label=""
                        nativeInputProps={{
                          type: "number",
                          min: 0,
                          ...register(`catégories.${index}.tranches.40:49`, { valueAsNumber: true }),
                        }}
                        state={get(errors, `catégories.${index}.tranches.40:49`) ? "error" : "default"}
                        stateRelatedMessage={
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          // @ts-ignore
                          get(errors, `catégories.${index}.tranches.40:49`)?.message
                        }
                      />
                    </td>
                    <td>
                      <Input
                        label=""
                        nativeInputProps={{
                          type: "number",
                          min: 0,
                          ...register(`catégories.${index}.tranches.50:`, { valueAsNumber: true }),
                        }}
                        state={get(errors, `catégories.${index}.tranches.50:`) ? "error" : "default"}
                        stateRelatedMessage={
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          // @ts-ignore
                          get(errors, `catégories.${index}.tranches.50:`)?.message
                        }
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          ))}
        </ClientOnly>

        <ButtonsGroup
          inlineLayoutWhen="sm and up"
          buttons={[
            {
              children: "Précédent",
              priority: "secondary",
              onClick: () => router.push(`${config.base_declaration_url}/remuneration`),
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
