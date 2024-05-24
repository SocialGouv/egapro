"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { type ComputedResult } from "@common/core-domain/computers/AbstractComputer";
import { IndicateurDeuxComputer, type Percentages } from "@common/core-domain/computers/IndicateurDeuxComputer";
import { IndicateurTroisComputer } from "@common/core-domain/computers/IndicateurTroisComputer";
import { IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { categories } from "@common/core-domain/computers/utils";
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import {
  type CreateSimulationDTO,
  type CreateSimulationWorkforceRangeMoreThan250DTO,
  createSteps,
} from "@common/core-domain/dtos/CreateSimulationDTO";
import { setValueAsFloatOrEmptyString } from "@common/utils/form";
import { precisePercentFormat } from "@common/utils/number";
import { zodFr } from "@common/utils/zod";
import { storePicker } from "@common/utils/zustand";
import { AideSimulationIndicateurDeux } from "@components/aide-simulation/IndicateurDeux";
import { AideSimulationIndicateurTrois } from "@components/aide-simulation/IndicateurTrois";
import { RadioOuiNon } from "@components/RHF/RadioOuiNon";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import {
  AlternativeTable,
  type AlternativeTableProps,
  BackNextButtonsGroup,
  Box,
  CenteredContainer,
  FormLayout,
  Link,
} from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { isEmpty } from "lodash";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { type FieldErrors, FormProvider, useForm } from "react-hook-form";
import { type z } from "zod";

import { NAVIGATION, simulateurPath } from "../navigation";
import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "../useSimuFunnelStore";
import { getPourcentagesAugmentationPromotionsWithCount, prepareIndicateurUnComputer } from "../utils";
import { Indicateur2ou3Note } from "./Indicateur2ou3Note";

type Indic2or3FormType = z.infer<typeof createSteps.indicateur2>;
type Indic2or3FormTypeWhenCalculable = Extract<Indic2or3FormType, { calculable: "oui" }>;

const indicateur1Computer = new IndicateurUnComputer();
const indicateur2Computer = new IndicateurDeuxComputer(indicateur1Computer);
const indicateur3Computer = new IndicateurTroisComputer(indicateur1Computer);

interface Indic2or3FormProps {
  indicateur: 2 | 3;
}

const schemaWithGlobalPourcentageVerification = (indicateur: Indic2or3FormProps["indicateur"]) =>
  createSteps.indicateur3.superRefine((obj, ctx) => {
    if (obj.calculable === "oui" && !isEmpty(obj.pourcentages)) {
      const areAllPourcentagesZero = Object.values(obj.pourcentages ?? {}).every(
        value => value.men === 0 && value.women === 0,
      );

      if (areAllPourcentagesZero) {
        const errorMessage = `Tous les champs ne peuvent être à 0 s'il y a eu des ${
          indicateur === 2 ? "augmentations" : "promotions"
        }`;
        ctx.addIssue({
          code: zodFr.ZodIssueCode.custom,
          message: errorMessage,
          path: ["root.totalPourcentages"],
        });
      }
      categories.forEach(category => {
        const categoryValues = obj.pourcentages[category] ?? null;
        if (categoryValues) {
          if (categoryValues.women === "")
            ctx.addIssue({
              code: zodFr.ZodIssueCode.custom,
              message: "Ce champs est requis",
              path: [`pourcentages.${category}.women`],
            });
          if (categoryValues.men === "")
            ctx.addIssue({
              code: zodFr.ZodIssueCode.custom,
              message: "Ce champs est requis",
              path: [`pourcentages.${category}.men`],
            });
        }
      });
    }
  });

const useStore = storePicker(useSimuFunnelStore);

export const Indic2or3Form = ({ indicateur }: Indic2or3FormProps) => {
  const router = useRouter();
  const [_funnel, saveFunnel] = useStore("funnel", "saveFunnel");
  const funnel = _funnel as Partial<CreateSimulationWorkforceRangeMoreThan250DTO> | undefined;
  const hydrated = useSimuFunnelStoreHasHydrated();

  if (hydrated) prepareIndicateurUnComputer(indicateur1Computer, funnel as CreateSimulationDTO);

  const computer = indicateur === 2 ? indicateur2Computer : indicateur3Computer;
  const indicateurNav = indicateur === 2 ? NAVIGATION.indicateur2 : NAVIGATION.indicateur3;
  const AideSimulationIndicateurDeuxOurTrois =
    indicateur === 2 ? AideSimulationIndicateurDeux : AideSimulationIndicateurTrois;

  const methods = useForm<Indic2or3FormType>({
    mode: "onChange",
    resolver: zodResolver(schemaWithGlobalPourcentageVerification(indicateur)),
    shouldUnregister: true,
    defaultValues: funnel?.[`indicateur${indicateur}`],
  });

  const {
    formState: { isValid, errors },
    handleSubmit,
    register,
    watch,
    setValue,
    reset,
    trigger,
  } = methods;

  const computableCheck = watch("calculable");
  const pourcentages = watch("pourcentages");

  let pourcentagesWithCount = undefined as Percentages | undefined;
  let computed = {} as ComputedResult;

  const canCompute = computer.canCompute();

  if (canCompute) {
    computed = computer.compute();
  }

  useEffect(() => {
    if (!canCompute && hydrated) {
      setValue("calculable", "non", { shouldValidate: true });
    } else {
      reset();
      trigger();
    }
  }, [canCompute, setValue, hydrated, reset, trigger]);

  if (!hydrated) {
    return (
      <CenteredContainer pb="6w">
        <SkeletonForm fields={1} />
      </CenteredContainer>
    );
  }

  // add count from "funnel.effectifs.csp" to pourcentages, to make pourcentagesWithCount
  if (funnel?.effectifs) {
    pourcentagesWithCount = getPourcentagesAugmentationPromotionsWithCount(
      funnel.effectifs.csp,
      pourcentages as Percentages,
    );

    computer.setInput(pourcentagesWithCount);
  }

  const onSubmit = async (indicateur2or3: Indic2or3FormType) => {
    saveFunnel({ [`indicateur${indicateur}`]: indicateur2or3 });
    router.push(simulateurPath(indicateurNav.next()));
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <ClientAnimate>
          {indicateur == 2 ? (
            <Alert
              className={fr.cx("fr-mb-2w")}
              severity="info"
              title="Aide au calcul"
              description={
                <p>
                  La notion d’augmentation individuelle correspond à une augmentation individuelle du salaire de base du
                  salarié concerné en excluant celle liée à une promotion. L’indicateur n’est pas calculable:
                  <br />
                  <ul>
                    <li>s’il n’a eu aucune augmentation au cours de la période de référence</li>
                    <li>
                      si le total des effectifs retenus est inférieur à 40% des effectifs pris en compte pour le calcul
                      des indicateurs
                    </li>
                  </ul>
                  Pour en savoir plus sur le calcul de cet indicateur,{" "}
                  <Link
                    target="_blank"
                    href="/aide-simulation#indicateur-cart-de-taux-d-augmentation-plus-de-250-salaries"
                  >
                    cliquez ici
                  </Link>
                </p>
              }
            />
          ) : (
            <Alert
              className={fr.cx("fr-mb-2w")}
              severity="info"
              title="Aide au calcul"
              description={
                <p>
                  La notion de promotion correspond au passage à un niveau ou coefficient hiérarchique supérieur.
                  L'indicateur n'est pas calculable:
                  <br />
                  <ul>
                    <li>s'il n'a eu aucune promotion au cours de la période de référence</li>
                    <li>
                      si le total des effectifs retenus est inférieur à 40% des effectifs pris en compte pour le calcul
                      des indicateurs
                    </li>
                  </ul>
                  Pour en savoir plus sur le calcul de cet indicateur,{" "}
                  <Link
                    target="_blank"
                    href="/aide-simulation#indicateur-cart-de-taux-de-promotion-plus-de-250-salaries"
                  >
                    cliquez ici
                  </Link>
                </p>
              }
            />
          )}
          <p className="fr-text--xs">Les champs suivis d'une * sont obligatoires</p>
          {!canCompute ? (
            <Alert
              className="fr-mb-3w"
              severity="info"
              title="L'indicateur n'est pas calculable"
              description="L’ensemble des groupes valides (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs."
            />
          ) : (
            <>
              <FormLayout>
                <RadioOuiNon
                  legend={`Y a-t-il eu des ${
                    indicateur === 2 ? "augmentations" : "promotions"
                  } individuelles durant la période de référence ? *`}
                  name="calculable"
                  triggerValidation={true}
                />
              </FormLayout>
              {computableCheck === "oui" ? (
                <>
                  <p>
                    Le pourcentage de femmes et d’hommes ayant été {indicateur === 2 ? "augmentés" : "promus"} durant la
                    période de référence, doit être renseigné par CSP.
                  </p>
                  <AlternativeTable
                    withTooltip
                    header={[
                      {
                        label: "Catégories socioprofessionnelles",
                      },
                      {
                        label: `Pourcentage de salariés ${indicateur === 2 ? "augmentés" : "promus"} *`,
                        subCols: [
                          {
                            label: "Femmes",
                          },
                          {
                            label: "Hommes",
                          },
                        ],
                      },
                      {
                        label: "Écarts pondérés",
                        informations: <AideSimulationIndicateurDeuxOurTrois.CommentEstCalculéLIndicateur />,
                      },
                    ]}
                    body={categories.map<AlternativeTableProps.BodyContent>(category => ({
                      categoryLabel: CSP.Label[category],
                      ...(() => {
                        const womenCount = pourcentagesWithCount?.[category]?.womenCount ?? 0;
                        const menCount = pourcentagesWithCount?.[category]?.menCount ?? 0;

                        if (womenCount < 10 && menCount < 10) {
                          return {
                            mergedLabel: "Non pris en compte car moins de 10 femmes / hommes",
                          };
                        } else if (womenCount < 10) {
                          return {
                            mergedLabel: "Non pris en compte car moins de 10 femmes",
                          };
                        } else if (menCount < 10) {
                          return {
                            mergedLabel: "Non pris en compte car moins de 10 hommes",
                          };
                        }
                        type ColsType = [AlternativeTableProps.ColType, ...AlternativeTableProps.ColType[]];
                        const categoryError = (errors as FieldErrors<Indic2or3FormTypeWhenCalculable>).pourcentages?.[
                          category
                        ];
                        return {
                          cols: [
                            {
                              label: `${category} - Femmes`,
                              state: categoryError?.women && "error",
                              stateRelatedMessage: categoryError?.women?.message,
                              nativeInputProps: {
                                ...register(`pourcentages.${category}.women`, {
                                  setValueAs: setValueAsFloatOrEmptyString,
                                  deps: ["root.totalPourcentages"],
                                }),
                                title: categoryError?.women?.message,
                                type: "number",
                                min: 0,
                                max: 100,
                              },
                            },
                            {
                              label: `${category} - Hommes`,
                              state: categoryError?.men && "error",
                              stateRelatedMessage: categoryError?.men?.message,
                              nativeInputProps: {
                                ...register(`pourcentages.${category}.men`, {
                                  setValueAs: setValueAsFloatOrEmptyString,
                                  deps: ["root.totalPourcentages"],
                                }),
                                title: categoryError?.men?.message,
                                type: "number",
                                min: 0,
                                max: 100,
                              },
                            },
                            (() => {
                              const { resultRaw: groupResult } = computer.computeGroup(category);

                              return !isNaN(groupResult) && isFinite(groupResult)
                                ? precisePercentFormat.format(groupResult / 100)
                                : "-";
                            })(),
                          ] satisfies ColsType,
                        };
                      })(),
                    }))}
                    footer={[
                      {
                        label: "Écart total",
                        colspan: 3,
                        align: "right",
                      },
                      {
                        label: (
                          <strong>
                            {!isNaN(computed.resultRaw) && isFinite(computed.resultRaw)
                              ? precisePercentFormat.format(computed.resultRaw / 100)
                              : "-"}
                          </strong>
                        ),
                      },
                    ]}
                  />
                  {errors?.root?.totalPourcentages?.message && (
                    <Alert
                      className="fr-mb-5w"
                      small
                      severity="warning"
                      description={errors.root.totalPourcentages.message}
                    />
                  )}
                  <Box mb="4w">
                    <Indicateur2ou3Note computer={computer} indicateur={indicateur} isValid={isValid} />
                  </Box>
                </>
              ) : (
                computableCheck === "non" && (
                  <Alert
                    className="fr-mb-3w"
                    severity="info"
                    title="L'indicateur n'est pas calculable"
                    description={`Il n'y a pas eu ${
                      indicateur === 2 ? "d'augmentations" : "de promotions"
                    } durant la période de référence.`}
                  />
                )
              )}
            </>
          )}
        </ClientAnimate>

        <FormLayout>
          <BackNextButtonsGroup
            backProps={{
              linkProps: {
                href: simulateurPath(indicateurNav.prev()),
              },
            }}
            nextDisabled={!isValid}
          />
        </FormLayout>
      </form>
    </FormProvider>
  );
};
