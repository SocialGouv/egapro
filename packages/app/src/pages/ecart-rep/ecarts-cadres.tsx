import { zodResolver } from "@hookform/resolvers/zod";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useFormManager } from "../../services/apiClient/form-manager";
import type { NextPageWithLayout } from "../_app";
import { strRadioToBool } from "@common/utils/string";
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
  FormInput,
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
import { formatZodErrors } from "@common/utils/debug";

const title = "Écarts de représentation";

const formSchema = z
  .object({
    isEcartsCadresCalculable: z.union([z.literal("true"), z.literal("false")]),
    motifEcartsCadresNonCalculable: z.string().trim().optional(),
    ecartsCadresHommes: z.number().optional(),
    ecartsCadresFemmes: z.number().optional(),
  })
  .superRefine(
    ({ isEcartsCadresCalculable, motifEcartsCadresNonCalculable, ecartsCadresHommes, ecartsCadresFemmes }, ctx) => {
      if (isEcartsCadresCalculable === "true" && !ecartsCadresHommes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le pourcentage d'hommes parmi les cadres dirigeants est obligatoire",
          path: ["ecartsCadresHommes"],
        });
      }
      if (isEcartsCadresCalculable === "true" && !ecartsCadresFemmes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le pourcentage de femmes parmi les cadres dirigeants est obligatoire",
          path: ["ecartsCadresFemmes"],
        });
      }
      if (isEcartsCadresCalculable === "false" && !motifEcartsCadresNonCalculable) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le motif de non calculabilité et obligatoire",
          path: ["motifEcartsCadresNonCalculable"],
        });
      }
    },
  );

type FormType = z.infer<typeof formSchema>;

const EcartsCadres: NextPageWithLayout = () => {
  const router = useRouter();
  const { formData, saveFormData } = useFormManager();
  const {
    formState: { errors, isDirty, isValid, isSubmitted },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<FormType>({
    mode: "onBlur",
    resolver: zodResolver(formSchema),
  });

  const isEcartsCadresCalculable = watch("isEcartsCadresCalculable");

  const resetForm = useCallback(() => {
    if (formData) {
      reset({
        isEcartsCadresCalculable: formData?.isEcartsCadresCalculable ? "true" : "false",
        motifEcartsCadresNonCalculable: formData?.motifEcartsCadresNonCalculable,
        ecartsCadresFemmes: formData?.ecartsCadresFemmes,
        ecartsCadresHommes: formData?.ecartsCadresHommes,
      });
    }
  }, [reset, formData]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const onSubmit = async ({
    isEcartsCadresCalculable,
    motifEcartsCadresNonCalculable,
    ecartsCadresFemmes,
    ecartsCadresHommes,
  }: FormType) => {
    saveFormData({
      isEcartsCadresCalculable: strRadioToBool(isEcartsCadresCalculable),
      motifEcartsCadresNonCalculable,
      ecartsCadresFemmes,
      ecartsCadresHommes,
    });
    router.push("/ecart-rep/ecarts-membres");
  };

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
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormLayout>
          <FormRadioGroup inline>
            <FormRadioGroupLegend id="isEcartsCadresCalculable">
              L’écart de représentation est-il calculable&nbsp;?
            </FormRadioGroupLegend>
            <FormRadioGroupContent>
              <FormRadioGroupInput
                {...register("isEcartsCadresCalculable")}
                id="yes"
                name="isEcartsCadresCalculable"
                value="true"
              >
                Oui
              </FormRadioGroupInput>
              <FormRadioGroupInput
                {...register("isEcartsCadresCalculable")}
                id="no"
                name="isEcartsCadresCalculable"
                value="false"
              >
                Non
              </FormRadioGroupInput>
            </FormRadioGroupContent>
          </FormRadioGroup>
          <pre>{formatZodErrors(errors as any)}</pre>
          <pre>{JSON.stringify(watch(), null, 2)}</pre>

          {isEcartsCadresCalculable === "true" ? (
            <>
              <FormGroup>
                <FormGroupLabel htmlFor="ecartsCadresFemmes">
                  Pourcentage de femmes parmi les cadres dirigeants
                </FormGroupLabel>
                <FormInput id="ecartsCadresFemmes" type="number" {...register("ecartsCadresFemmes")} />
                {errors.ecartsCadresFemmes && (
                  <FormGroupMessage id="ecartsCadresFemmes-message-error">
                    {errors.ecartsCadresFemmes.message}
                  </FormGroupMessage>
                )}
              </FormGroup>
              <FormGroup>
                <FormGroupLabel htmlFor="ecartsCadresHommes">
                  Pourcentage d'hommes parmi les cadres dirigeants
                </FormGroupLabel>
                <FormInput id="ecartsCadresHommes" type="number" {...register("ecartsCadresHommes")} />
                {errors.ecartsCadresHommes && (
                  <FormGroupMessage id="ecartsCadresHommes-message-error">
                    {errors.ecartsCadresHommes.message}
                  </FormGroupMessage>
                )}
              </FormGroup>
            </>
          ) : (
            <FormGroup>
              <FormGroupLabel htmlFor="motifEcartsCadresNonCalculable">Motif de non calculabilité</FormGroupLabel>
              <FormSelect id="motifEcartsCadresNonCalculable" {...register("motifEcartsCadresNonCalculable")}>
                <option value="0">Il n'y a aucun cadre dirigeant</option>
                <option value="1">Il n'y a qu'un seul cadre dirigeant</option>
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
