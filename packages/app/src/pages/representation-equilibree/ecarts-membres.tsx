import { motifNonCalculabiliteMembresOptions } from "@common/models/representation-equilibree";
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

import type { NextPageWithLayout } from "../_app";

const formSchema = z
  .object({
    isEcartsMembresCalculable: zodRadioInputSchema,
    motifEcartsMembresNonCalculable: z
      .string()
      .transform((val, ctx) => {
        if (!motifNonCalculabiliteMembresOptions.find(elt => elt.value === val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le champ est requiss",
          });
          return z.NEVER;
        }
        return val;
      })
      .optional(),
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

export type FormTypeInput = z.input<typeof formSchema>;

// Fix TS limit to infer correct litterals in zod definition.
export type FormTypeOutput = Omit<z.infer<typeof formSchema>, "motifEcartsMembresNonCalculable"> & {
  motifEcartsMembresNonCalculable: typeof motifNonCalculabiliteMembresOptions[number]["value"];
};

const EcartsMembres: NextPageWithLayout = () => {
  const router = useRouter();
  const { formData, saveFormData } = useFormManager();
  const methods = useForm<FormTypeInput>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      isEcartsMembresCalculable: radioBoolToString(formData?.isEcartsMembresCalculable),
      motifEcartsMembresNonCalculable: formData?.motifEcartsMembresNonCalculable || "",
      ecartsMembresFemmes: String(formData?.ecartsMembresFemmes) || "",
      ecartsMembresHommes: String(formData?.ecartsMembresHommes) || "",
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

  const isEcartsMembresCalculable = watch("isEcartsMembresCalculable");

  const onSubmit = (data: FormTypeInput) => {
    // At this point, we passed the zod validation so the data are now compliant with FormType so casting is safe.
    const { isEcartsMembresCalculable, motifEcartsMembresNonCalculable, ecartsMembresFemmes, ecartsMembresHommes } =
      data as FormTypeOutput;

    const isEcartsMembresCalculableBoolVal = radioStringToBool(isEcartsMembresCalculable);

    saveFormData({
      isEcartsMembresCalculable: isEcartsMembresCalculableBoolVal,
      motifEcartsMembresNonCalculable:
        isEcartsMembresCalculableBoolVal || !motifEcartsMembresNonCalculable
          ? undefined
          : motifEcartsMembresNonCalculable,
      ecartsMembresFemmes: isEcartsMembresCalculableBoolVal ? ecartsMembresFemmes : undefined,
      ecartsMembresHommes: isEcartsMembresCalculableBoolVal ? ecartsMembresHommes : undefined,
    });

    // Skip directly to validation page if all indicators are not calculable.
    const nextPage =
      isEcartsMembresCalculableBoolVal === false && formData?.isEcartsCadresCalculable === false
        ? "/representation-equilibree/validation"
        : "/representation-equilibree/publication";

    router.push(nextPage);
  };

  useEffect(() => {
    // Using setValue to undefined, is the way to tell RHF to ignore these inputs in the submit phase. So, we not really set the value undefined, we just ignore them.
    if (isEcartsMembresCalculable === "oui") {
      setValue("motifEcartsMembresNonCalculable", undefined, { shouldValidate: true });
    } else {
      setValue("ecartsMembresFemmes", undefined, { shouldValidate: true });
      setValue("ecartsMembresHommes", undefined, { shouldValidate: true });
    }
    clearErrors();
  }, [clearErrors, isEcartsMembresCalculable, setValue]);

  return (
    <>
      <AlertEdition />

      <Alert mb="4w">
        <AlertTitle as="h2">Motifs de non calculabilité</AlertTitle>
        <p>
          Les écarts de représentation femmes-hommes parmi les membres des instances dirigeantes sont incalculables
          lorsqu'il n'y a pas d'instance dirigeante.
        </p>
      </Alert>

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
                  aria-describedby={
                    errors.motifEcartsMembresNonCalculable && "motifEcartsMembresNonCalculable-message-error"
                  }
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
              <ButtonAsLink href="/representation-equilibree/ecarts-cadres" variant="secondary">
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
    </>
  );
};

EcartsMembres.getLayout = ({ children }) => {
  return (
    <RepresentationEquilibreeLayout title="Écarts de représentation parmi les membres des instances dirigeantes">
      {children}
    </RepresentationEquilibreeLayout>
  );
};

export default EcartsMembres;
