import { motifNonCalculabiliteCadresOptions } from "@common/models/representation-equilibree";
import { radioBoolToString, radioStringToBool, zodPercentageSchema, zodRadioInputSchema } from "@common/utils/form";
import { AlertEdition } from "@components/AlertEdition";
import { RepresentationEquilibreeLayout } from "@components/layouts/RepresentationEquilibreeLayout";
import { PercentagesPairInputs } from "@components/PercentagesPairInputs";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormManager } from "@services/apiClient";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { type NextPageWithLayout } from "../_app";

const formSchema = z
  .object({
    isEcartsCadresCalculable: zodRadioInputSchema,
    motifEcartsCadresNonCalculable: z
      .string()
      .transform((val, ctx) => {
        if (!motifNonCalculabiliteCadresOptions.find(elt => elt.value === val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le champ est requis",
          });
          return z.NEVER;
        }
        return val;
      })
      .optional(),
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
          message: "Le motif de non calculabilité est obligatoire",
          path: ["motifEcartsCadresNonCalculable"],
        });
      }
    },
  );

export type FormTypeInput = z.input<typeof formSchema>;
// Fix TS limit to infer correct litterals in zod definition.
export type FormTypeOutput = Omit<z.infer<typeof formSchema>, "motifEcartsCadresNonCalculable"> & {
  motifEcartsCadresNonCalculable: (typeof motifNonCalculabiliteCadresOptions)[number]["value"];
};

const EcartsCadres: NextPageWithLayout = () => {
  const router = useRouter();
  const { formData, saveFormData } = useFormManager();
  const methods = useForm<FormTypeInput>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      isEcartsCadresCalculable: radioBoolToString(formData?.isEcartsCadresCalculable),
      motifEcartsCadresNonCalculable: formData?.motifEcartsCadresNonCalculable || "",
      ecartsCadresFemmes: String(formData?.ecartsCadresFemmes) || "",
      ecartsCadresHommes: String(formData?.ecartsCadresHommes) || "",
    },
  });

  const {
    clearErrors,
    formState: { isValid, errors },
    handleSubmit,
    register,
    setValue,
    watch,
  } = methods;

  const isEcartsCadresCalculable = watch("isEcartsCadresCalculable");

  const onSubmit = (data: FormTypeInput) => {
    // At this point, we passed the zod validation so the data are now compliant with FormType so casting is safe.
    const { isEcartsCadresCalculable, motifEcartsCadresNonCalculable, ecartsCadresFemmes, ecartsCadresHommes } =
      data as FormTypeOutput;

    const isEcartsCadresCalculableBoolVal = radioStringToBool(isEcartsCadresCalculable);

    saveFormData({
      isEcartsCadresCalculable: isEcartsCadresCalculableBoolVal,
      motifEcartsCadresNonCalculable:
        isEcartsCadresCalculableBoolVal || !motifEcartsCadresNonCalculable ? undefined : motifEcartsCadresNonCalculable,
      ecartsCadresFemmes: isEcartsCadresCalculableBoolVal ? ecartsCadresFemmes : undefined,
      ecartsCadresHommes: isEcartsCadresCalculableBoolVal ? ecartsCadresHommes : undefined,
    });
    router.push("/representation-equilibree/ecarts-membres");
  };

  useEffect(() => {
    // Using setValue to undefined, is the way to tell RHF to ignore these inputs in the submit phase. So, we not really set the value undefined, we just ignore them.
    if (isEcartsCadresCalculable === "oui") {
      setValue("motifEcartsCadresNonCalculable", undefined, { shouldValidate: true });
    } else {
      setValue("ecartsCadresFemmes", undefined, { shouldValidate: true });
      setValue("ecartsCadresHommes", undefined, { shouldValidate: true });
    }
    clearErrors();
  }, [clearErrors, isEcartsCadresCalculable, setValue]);

  return (
    <>
      <AlertEdition />

      <Alert mb="4w">
        <AlertTitle as="h2">Motifs de non calculabilité</AlertTitle>
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
            {isEcartsCadresCalculable === "oui" && (
              <PercentagesPairInputs
                firstInput={{ label: "ecartsCadresFemmes", title: "Pourcentage de femmes parmi les cadres dirigeants" }}
                secondInput={{ label: "ecartsCadresHommes", title: "Pourcentage d'hommes parmi les cadres dirigeants" }}
              />
            )}
            {isEcartsCadresCalculable === "non" && (
              <FormGroup>
                <FormGroupLabel htmlFor="motifEcartsCadresNonCalculable">Motif de non calculabilité</FormGroupLabel>
                <FormSelect
                  id="motifEcartsCadresNonCalculable"
                  placeholder="Sélectionnez une option"
                  {...register("motifEcartsCadresNonCalculable")}
                  aria-describedby={
                    errors.motifEcartsCadresNonCalculable && "motifEcartsCadresNonCalculable-message-error"
                  }
                >
                  <option value={motifNonCalculabiliteCadresOptions[0].value}>
                    {motifNonCalculabiliteCadresOptions[0].label}
                  </option>
                  <option value={motifNonCalculabiliteCadresOptions[1].value}>
                    {motifNonCalculabiliteCadresOptions[1].label}
                  </option>
                </FormSelect>

                {errors.motifEcartsCadresNonCalculable && (
                  <FormGroupMessage id="motifEcartsCadresNonCalculable-message-error">
                    {errors.motifEcartsCadresNonCalculable.message}
                  </FormGroupMessage>
                )}
              </FormGroup>
            )}
            <FormLayoutButtonGroup>
              <ButtonAsLink href="/representation-equilibree/periode-reference" variant="secondary">
                Précédent
              </ButtonAsLink>
              <FormButton isDisabled={!isValid}>Suivant</FormButton>
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
  return (
    <RepresentationEquilibreeLayout title="Écarts de représentation parmi les cadres dirigeants">
      {children}
    </RepresentationEquilibreeLayout>
  );
};

export default EcartsCadres;
