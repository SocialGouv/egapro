import { zodResolver } from "@hookform/resolvers/zod";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { motifEcartsCadresNonCalculableValues, useFormManager } from "../../services/apiClient/form-manager";
import type { NextPageWithLayout } from "../_app";
import { strRadioToBool } from "@common/utils/form";
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

const title = "Écarts de représentation";

const formSchema = z
  .object({
    isEcartsCadresCalculable: z.union([z.literal("oui"), z.literal("non")]),
    motifEcartsCadresNonCalculable: z.enum(motifEcartsCadresNonCalculableValues).optional(),
    ecartsCadresFemmes: z
      .number()
      .nonnegative({ message: "Le pourcentage doit être positif" })
      .lte(100, { message: "Le pourcentage maximum est 100" })
      .optional(),
    ecartsCadresHommes: z
      .number()
      .nonnegative({ message: "Le pourcentage doit être positif" })
      .lte(100, { message: "Le pourcentage maximum est 100" })
      .optional(),
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

type FormType = z.infer<typeof formSchema>;

const EcartsCadres: NextPageWithLayout = () => {
  const router = useRouter();
  const { formData, saveFormData } = useFormManager();
  const {
    clearErrors,
    formState: { errors, isDirty, isValid, isSubmitted },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<FormType>({
    resolver: zodResolver(formSchema),
  });

  const isEcartsCadresCalculable = watch("isEcartsCadresCalculable");

  const resetForm = useCallback(() => {
    if (formData) {
      reset({
        isEcartsCadresCalculable: formData?.isEcartsCadresCalculable ? "oui" : "non",
        motifEcartsCadresNonCalculable: formData?.motifEcartsCadresNonCalculable,
        ecartsCadresFemmes: formData?.ecartsCadresFemmes,
        ecartsCadresHommes: formData?.ecartsCadresHommes,
      });
    }
  }, [reset, formData]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  // TODO: unit tests
  const syncPercentages = (event: React.FormEvent<HTMLInputElement>) => {
    const inputChanged = event.currentTarget;
    const inputChangedStringValue = event.currentTarget.value;
    const inputChangedNumberValue = inputChanged.valueAsNumber;

    if (inputChangedStringValue?.length > 0 && inputChanged.id === "ecartsCadresFemmes") {
      setValue("ecartsCadresFemmes", inputChangedNumberValue, { shouldValidate: true });
      if (inputChangedNumberValue >= 0 && inputChangedNumberValue <= 100) {
        setValue("ecartsCadresHommes", 100 - inputChangedNumberValue, { shouldValidate: true });
      }
      return;
    }
    if (inputChangedStringValue?.length > 0 && inputChanged.id === "ecartsCadresHommes") {
      setValue("ecartsCadresHommes", inputChangedNumberValue, { shouldValidate: true });
      if (inputChangedNumberValue >= 0 && inputChangedNumberValue <= 100) {
        setValue("ecartsCadresFemmes", 100 - inputChangedNumberValue, { shouldValidate: true });
      }
    }
  };

  const clearMotif = () => {
    setValue("motifEcartsCadresNonCalculable", undefined);
  };

  const clearEcartsCadres = () => {
    setValue("ecartsCadresFemmes", undefined);
    setValue("ecartsCadresHommes", undefined, { shouldValidate: true });
  };

  const onChangeRadioInput = (event: React.FormEvent<HTMLInputElement>) => {
    const inputRadioValue = event.currentTarget.value;
    if (inputRadioValue === "oui") {
      clearMotif();
    } else {
      clearEcartsCadres();
    }
    clearErrors();
  };

  const onSubmit = ({
    isEcartsCadresCalculable,
    motifEcartsCadresNonCalculable,
    ecartsCadresFemmes,
    ecartsCadresHommes,
  }: FormType) => {
    const isEcartsCadresCalculableBoolVal = strRadioToBool(isEcartsCadresCalculable);
    saveFormData({
      isEcartsCadresCalculable: isEcartsCadresCalculableBoolVal,
      motifEcartsCadresNonCalculable: isEcartsCadresCalculableBoolVal ? undefined : motifEcartsCadresNonCalculable,
      ecartsCadresFemmes: isEcartsCadresCalculableBoolVal ? ecartsCadresFemmes : undefined,
      ecartsCadresHommes: isEcartsCadresCalculableBoolVal ? ecartsCadresHommes : undefined,
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
                {...register("isEcartsCadresCalculable", {
                  onChange: event => onChangeRadioInput(event),
                })}
                id="oui"
                name="isEcartsCadresCalculable"
                value="oui"
              >
                Oui
              </FormRadioGroupInput>
              <FormRadioGroupInput
                {...register("isEcartsCadresCalculable", {
                  onChange: event => onChangeRadioInput(event),
                })}
                id="non"
                name="isEcartsCadresCalculable"
                value="non"
              >
                Non
              </FormRadioGroupInput>
            </FormRadioGroupContent>
          </FormRadioGroup>

          {isEcartsCadresCalculable === "oui" ? (
            <>
              <FormGroup>
                <FormGroupLabel htmlFor="ecartsCadresFemmes">
                  Pourcentage de femmes parmi les cadres dirigeants
                </FormGroupLabel>
                <FormInput
                  {...register("ecartsCadresFemmes", {
                    onChange: event => {
                      syncPercentages(event);
                    },
                  })}
                  id="ecartsCadresFemmes"
                  type="number"
                  min="0"
                  max="100"
                  aria-describedby="ecartsCadresFemmes-message-error"
                />
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
                <FormInput
                  {...register("ecartsCadresHommes", {
                    onChange: event => {
                      syncPercentages(event);
                    },
                  })}
                  id="ecartsCadresHommes"
                  type="number"
                  min="0"
                  max="100"
                  aria-describedby="ecartsCadresHommes-message-error"
                />
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
