import { zodResolver } from "@hookform/resolvers/zod";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import type { NextPageWithLayout } from "../_app";
import { radioBoolToString, radioStringToBool, zodPercentageSchema, zodRadioInputSchema } from "@common/utils/form";
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
import { motifEcartsCadresNonCalculableValues, useFormManager } from "@services/apiClient";

const title = "Écarts de représentation";

const formSchema = z
  .object({
    isEcartsCadresCalculable: zodRadioInputSchema,
    motifEcartsCadresNonCalculable: z.enum(motifEcartsCadresNonCalculableValues).optional(),
    ecartsCadresFemmes: zodPercentageSchema,
    ecartsCadresHommes: zodPercentageSchema,
  })
  .superRefine(
    ({ isEcartsCadresCalculable, motifEcartsCadresNonCalculable, ecartsCadresHommes, ecartsCadresFemmes }, ctx) => {
      if (isEcartsCadresCalculable === "oui" && typeof ecartsCadresHommes === "undefined") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le pourcentage d'hommes parmi les cadres dirigeants est obligatoire",
          path: ["ecartsCadresHommes"],
        });
      }
      if (isEcartsCadresCalculable === "oui" && typeof ecartsCadresFemmes === "undefined") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le pourcentage de femmes parmi les cadres dirigeants est obligatoire",
          path: ["ecartsCadresFemmes"],
        });
      }
      if (isEcartsCadresCalculable === "non" && typeof motifEcartsCadresNonCalculable === "undefined") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le motif de non calculabilité et obligatoire",
          path: ["motifEcartsCadresNonCalculable"],
        });
      }
    },
  );

export type FormType = z.infer<typeof formSchema>;

const EcartsCadres: NextPageWithLayout = () => {
  const router = useRouter();
  const { formData, saveFormData } = useFormManager();
  const methods = useForm<FormType>({
    resolver: zodResolver(formSchema),
  });

  const {
    clearErrors,
    formState: { isDirty, isValid, isSubmitted },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = methods;

  const isEcartsCadresCalculable = watch("isEcartsCadresCalculable");

  const resetForm = useCallback(() => {
    if (formData) {
      reset({
        isEcartsCadresCalculable: radioBoolToString(formData?.isEcartsCadresCalculable),
        motifEcartsCadresNonCalculable: formData?.motifEcartsCadresNonCalculable,
        ecartsCadresFemmes: formData?.ecartsCadresFemmes,
        ecartsCadresHommes: formData?.ecartsCadresHommes,
      });
    }
  }, [reset, formData]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const onSubmit = ({
    isEcartsCadresCalculable,
    motifEcartsCadresNonCalculable,
    ecartsCadresFemmes,
    ecartsCadresHommes,
  }: FormType) => {
    const isEcartsCadresCalculableBoolVal = radioStringToBool(isEcartsCadresCalculable);

    saveFormData({
      isEcartsCadresCalculable: isEcartsCadresCalculableBoolVal,
      motifEcartsCadresNonCalculable: isEcartsCadresCalculableBoolVal ? undefined : motifEcartsCadresNonCalculable,
      ecartsCadresFemmes: isEcartsCadresCalculableBoolVal ? ecartsCadresFemmes : undefined,
      ecartsCadresHommes: isEcartsCadresCalculableBoolVal ? ecartsCadresHommes : undefined,
    });
    router.push("/ecart-rep/ecarts-membres");
  };

  useEffect(() => {
    if (isEcartsCadresCalculable === "oui") {
      setValue("motifEcartsCadresNonCalculable", undefined, { shouldValidate: true });
    } else {
      setValue("ecartsCadresFemmes", undefined, { shouldValidate: true });
      setValue("ecartsCadresHommes", undefined, { shouldValidate: true });
      setValue("motifEcartsCadresNonCalculable", motifEcartsCadresNonCalculableValues[0], { shouldValidate: true });
    }
    clearErrors();
  }, [clearErrors, isEcartsCadresCalculable, setValue]);

  return (
    <>
      <h1>{title}</h1>
      <h2>Cadres dirigeants</h2>
      <Alert mb="4w">
        <AlertTitle as="h3">Motifs de non calculabilité</AlertTitle>
        <p>
          Les écarts de représentation Femmes-Hommes parmi les cadres dirigeants sont incalculables lorsqu'il n'y aucun
          ou un seul cadre dirigeant.
        </p>
      </Alert>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormLayout>
            <FormRadioGroup inline>
              <FormRadioGroupLegend id="isEcartsCadresCalculable">
                L’écart de représentation est-il calculable&nbsp;?
              </FormRadioGroupLegend>
              <FormRadioGroupContent>
                <FormRadioGroupInput
                  {...register("isEcartsCadresCalculable")}
                  id="oui"
                  name="isEcartsCadresCalculable"
                  value="oui"
                >
                  Oui
                </FormRadioGroupInput>
                <FormRadioGroupInput
                  {...register("isEcartsCadresCalculable")}
                  id="non"
                  name="isEcartsCadresCalculable"
                  value="non"
                >
                  Non
                </FormRadioGroupInput>
              </FormRadioGroupContent>
            </FormRadioGroup>

            {isEcartsCadresCalculable === "oui" ? (
              <PercentagesPairInputs
                input1={{ label: "ecartsCadresFemmes", title: "Pourcentage de femmes parmi les cadres dirigeants" }}
                input2={{ label: "ecartsCadresHommes", title: "Pourcentage d'hommes parmi les cadres dirigeants" }}
              />
            ) : (
              <FormGroup>
                <FormGroupLabel htmlFor="motifEcartsCadresNonCalculable">Motif de non calculabilité</FormGroupLabel>
                <FormSelect id="motifEcartsCadresNonCalculable" {...register("motifEcartsCadresNonCalculable")}>
                  <option value={motifEcartsCadresNonCalculableValues[0]}>Il n'y a aucun cadre dirigeant</option>
                  <option value={motifEcartsCadresNonCalculableValues[1]}>Il n'y a qu'un seul cadre dirigeant</option>
                </FormSelect>
              </FormGroup>
            )}
            <FormLayoutButtonGroup>
              <NextLink href="/ecart-rep/periode-reference" passHref>
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
                <CardBodyContentTitle>Cadres dirigeants</CardBodyContentTitle>
                <CardBodyContentDescription>
                  Sont considérés comme ayant la qualité de cadre dirigeant les cadres auxquels sont confiées des
                  responsabilités dont l'importance implique une grande indépendance dans l'organisation de leur emploi
                  du temps, qui sont habilités à prendre des décisions de façon largement autonome et qui perçoivent une
                  rémunération se situant dans les niveaux les plus élevés des systèmes de rémunération pratiqués dans
                  leur entreprise ou établissement.
                </CardBodyContentDescription>
              </CardBodyContent>
              <CardBodyFooter>
                <LinkGroup>
                  <Link href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006902439/" target="_blank">
                    En savoir plus
                  </Link>
                </LinkGroup>
              </CardBodyFooter>
            </CardBody>
          </Card>
        </GridCol>
      </Grid>
    </>
  );
};

EcartsCadres.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout>{children}</RepartitionEquilibreeLayout>;
};

export default EcartsCadres;
