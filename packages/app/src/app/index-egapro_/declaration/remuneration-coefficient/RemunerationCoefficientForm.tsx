"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { config } from "@common/config";
import { zodRealPositiveIntegerSchema } from "@common/utils/form";
import { ClientOnly } from "@components/ClientOnly";
import { ReactHookFormDebug } from "@components/utils/debug/ReactHookFormDebug";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { type DeclarationFormState } from "@services/form/declaration/DeclarationFormBuilder";
import { get } from "lodash";
import { useRouter } from "next/navigation";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  catégories: z.array(
    z.object({
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

const defaultTranch = [{ tranches: { ":29": 0, "30:39": 0, "40:49": 0, "50:": 0 } }];

export const RemunerationCoefficientForm = () => {
  const { formData, savePageData } = useDeclarationFormManager();
  const router = useRouter();

  const methods = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      catégories: formData.rémunérationsCoefficients?.catégories,
    },
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = methods;

  const {
    fields: catégories,
    append,
    remove,
  } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: "catégories",
  });

  console.log("errors", errors);

  const onSubmit = async (data: FormType) => {
    savePageData("rémunérationsCoefficients", data as DeclarationFormState["rémunérationsCoefficients"]);
    router.push(`${config.base_declaration_url}/remuneration-resultat`);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ClientOnly fallback={<SkeletonForm fields={2} />}>
          <ReactHookFormDebug />

          {catégories?.map((catégorie, index) => (
            <>
              <h3>{`Coefficient ${index + 1}`}</h3>
              <Button onClick={() => remove(index)}>Supprimer</Button>

              <table key={catégorie.id} className={fr.cx("fr-mb-4w")}>
                <caption>{`Coefficient ${index + 1}`}</caption>
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
        <Button onClick={() => append(defaultTranch)}>Ajouter un coefficient</Button>

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
