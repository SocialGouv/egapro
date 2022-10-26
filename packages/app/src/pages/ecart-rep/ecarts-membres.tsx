import { zodResolver } from "@hookform/resolvers/zod";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import type { NextPageWithLayout } from "../_app";
import { motifNonCalculabiliteMembresOptions } from "@common/models/repartition-equilibree";
import { radioBoolToString, radioStringToBool, zodPercentageSchema, zodRadioInputSchema } from "@common/utils/form";

import { ClientOnly } from "@components/ClientOnly";
import { PercentagesPairInputs } from "@components/PercentagesPairInputs";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";
import {
  Alert,
  AlertTitle,
  ButtonAsLink,
  Card,
  CardBody,
  CardBodyContent,
  CardBodyContentDescription,
  CardBodyContentDetails,
  CardBodyContentStart,
  CardBodyContentTitle,
  CardBodyFooter,
  FormButton,
  FormGroup,
  FormGroupLabel,
  FormGroupMessage,
  FormLayout,
  FormLayoutButtonGroup,
  FormRadioGroup,
  FormRadioGroupContent,
  FormRadioGroupInput,
  FormRadioGroupLegend,
  FormSelect,
  Grid,
  GridCol,
  Link,
  LinkGroup,
} from "@design-system";
import { useFormManager, useUser } from "@services/apiClient";

// Ensure the following variable is in sync with motifNonCalculabiliteMembresOptions[number].value;
export const motifEcartsMembresNonCalculableValues = ["aucune_instance_dirigeante"] as const;

const formSchema = z
  .object({
    isEcartsMembresCalculable: zodRadioInputSchema,
    motifEcartsMembresNonCalculable: z.enum(motifEcartsMembresNonCalculableValues).optional(),
    ecartsMembresFemmes: zodPercentageSchema,
    ecartsMembresHommes: zodPercentageSchema,
  })
  .superRefine(
    ({ isEcartsMembresCalculable, motifEcartsMembresNonCalculable, ecartsMembresHommes, ecartsMembresFemmes }, ctx) => {
      if (isEcartsMembresCalculable === "oui" && typeof ecartsMembresHommes === "undefined") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le pourcentage d'hommes parmi les membres des instances dirigeantes est obligatoire",
          path: ["ecartsMembresHommes"],
        });
      }
      if (isEcartsMembresCalculable === "oui" && typeof ecartsMembresFemmes === "undefined") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le pourcentage de femmes parmi les membres des instances dirigeantes est obligatoire",
          path: ["ecartsMembresFemmes"],
        });
      }
      if (isEcartsMembresCalculable === "non" && typeof motifEcartsMembresNonCalculable === "undefined") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le motif de non calculabilité est obligatoire",
          path: ["motifEcartsMembresNonCalculable"],
        });
      }
    },
  );

export type FormType = z.infer<typeof formSchema>;

const EcartsMembres: NextPageWithLayout = () => {
  useUser({ redirectTo: "/ecart-rep/email" });
  const router = useRouter();
  const { formData, saveFormData } = useFormManager();
  const methods = useForm<FormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      isEcartsMembresCalculable: radioBoolToString(formData?.isEcartsMembresCalculable),
      motifEcartsMembresNonCalculable: formData?.motifEcartsMembresNonCalculable,
      ecartsMembresFemmes: formData?.ecartsMembresFemmes,
      ecartsMembresHommes: formData?.ecartsMembresHommes,
    },
  });

  const {
    clearErrors,
    formState: { isDirty, isValid, isSubmitted, errors },
    handleSubmit,
    register,
    setValue,
    watch,
  } = methods;

  const isEcartsMembresCalculable = watch("isEcartsMembresCalculable");

  const onSubmit = ({
    isEcartsMembresCalculable,
    motifEcartsMembresNonCalculable,
    ecartsMembresFemmes,
    ecartsMembresHommes,
  }: FormType) => {
    const isEcartsMembresCalculableBoolVal = radioStringToBool(isEcartsMembresCalculable);

    saveFormData({
      isEcartsMembresCalculable: isEcartsMembresCalculableBoolVal,
      motifEcartsMembresNonCalculable: isEcartsMembresCalculableBoolVal ? undefined : motifEcartsMembresNonCalculable,
      ecartsMembresFemmes: isEcartsMembresCalculableBoolVal ? ecartsMembresFemmes : undefined,
      ecartsMembresHommes: isEcartsMembresCalculableBoolVal ? ecartsMembresHommes : undefined,
    });

    // Skip directly to validation page if all indicators are not calculable.
    const nextPage =
      isEcartsMembresCalculableBoolVal === false && formData?.isEcartsCadresCalculable === false
        ? "/ecart-rep/validation"
        : "/ecart-rep/publication";

    router.push(nextPage);
  };

  useEffect(() => {
    if (isEcartsMembresCalculable === "oui") {
      setValue("motifEcartsMembresNonCalculable", undefined, { shouldValidate: true });
    } else {
      setValue("ecartsMembresFemmes", undefined, { shouldValidate: true });
      setValue("ecartsMembresHommes", undefined, { shouldValidate: true });
    }
    clearErrors();
  }, [clearErrors, isEcartsMembresCalculable, setValue]);

  return (
    <ClientOnly>
      {isEcartsMembresCalculable === undefined && (
        <Alert mb="4w">
          <AlertTitle as="h2">Motifs de non calculabilité</AlertTitle>
          <p>
            Les écarts de représentation femmes-hommes parmi les membres des instances dirigeantes sont incalculables
            lorsqu'il n'y a pas d'instance dirigeante.
          </p>
        </Alert>
      )}

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormLayout>
            <FormRadioGroup inline>
              <FormRadioGroupLegend id="isEcartsMembresCalculable">
                L’écart de représentation est-il calculable&nbsp;?
              </FormRadioGroupLegend>
              <FormRadioGroupContent>
                <FormRadioGroupInput
                  {...register("isEcartsMembresCalculable")}
                  id="oui"
                  name="isEcartsMembresCalculable"
                  value="oui"
                >
                  Oui
                </FormRadioGroupInput>
                <FormRadioGroupInput
                  {...register("isEcartsMembresCalculable")}
                  id="non"
                  name="isEcartsMembresCalculable"
                  value="non"
                >
                  Non
                </FormRadioGroupInput>
              </FormRadioGroupContent>
            </FormRadioGroup>
            {isEcartsMembresCalculable === "oui" && (
              <PercentagesPairInputs
                firstInput={{
                  label: "ecartsMembresFemmes",
                  title: "Pourcentage de femmes parmi les membres des instances dirigeantes",
                }}
                secondInput={{
                  label: "ecartsMembresHommes",
                  title: "Pourcentage d'hommes parmi les membres des instances dirigeantes",
                }}
              />
            )}
            {isEcartsMembresCalculable === "non" && (
              <FormGroup>
                <FormGroupLabel htmlFor="motifEcartsMembresNonCalculable">Motif de non calculabilité</FormGroupLabel>
                <FormSelect
                  id="motifEcartsMembresNonCalculable"
                  placeholder="Sélectionnez une option"
                  {...register("motifEcartsMembresNonCalculable")}
                  aria-describedby="motifEcartsMembresNonCalculable-message-error"
                >
                  <option value={motifNonCalculabiliteMembresOptions[0].value}>
                    {motifNonCalculabiliteMembresOptions[0].label}
                  </option>
                </FormSelect>

                {errors.motifEcartsMembresNonCalculable && (
                  <FormGroupMessage id="motifEcartsMembresNonCalculable-message-error">
                    {errors.motifEcartsMembresNonCalculable.message}
                  </FormGroupMessage>
                )}
              </FormGroup>
            )}
            <FormLayoutButtonGroup>
              <NextLink href="/ecart-rep/ecarts-cadres" passHref>
                <ButtonAsLink variant="secondary">Précédent</ButtonAsLink>
              </NextLink>
              <FormButton isDisabled={!isValid || (isSubmitted && !isDirty)}>Suivant</FormButton>
            </FormLayoutButtonGroup>
          </FormLayout>
        </form>
      </FormProvider>

      <Grid mt="4w">
        <GridCol>
          <Card>
            <CardBody>
              <CardBodyContent>
                <CardBodyContentStart>
                  <CardBodyContentDetails icon="fr-icon-arrow-right-line">Définition</CardBodyContentDetails>
                </CardBodyContentStart>

                <CardBodyContentTitle>Membres des instances dirigeantes</CardBodyContentTitle>
                <CardBodyContentDescription>
                  Est considérée comme instance dirigeante toute instance mise en place au sein de la société, par tout
                  acte ou toute pratique sociétaire, aux fins d'assister régulièrement les organes chargés de la
                  direction générale dans l'exercice de leurs missions.
                </CardBodyContentDescription>
              </CardBodyContent>
              <CardBodyFooter>
                <LinkGroup>
                  <Link target="_blank" href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044566715">
                    En savoir plus
                  </Link>
                </LinkGroup>
              </CardBodyFooter>
            </CardBody>
          </Card>
        </GridCol>
      </Grid>
    </ClientOnly>
  );
};

EcartsMembres.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout>{children}</RepartitionEquilibreeLayout>;
};

export default EcartsMembres;
