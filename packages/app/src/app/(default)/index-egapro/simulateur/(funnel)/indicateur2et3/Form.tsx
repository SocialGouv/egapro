"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { IndicateurDeuxTroisComputer } from "@common/core-domain/computers/IndicateurDeuxTroisComputer";
import { IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import {
  type CreateSimulationDTO,
  type CreateSimulationWorkforceRangeLessThan250DTO,
  createSteps,
} from "@common/core-domain/dtos/CreateSimulationDTO";
import { setValueAsFloatOrEmptyString } from "@common/utils/form";
import { percentFormat } from "@common/utils/number";
import { type ClearObject } from "@common/utils/types";
import { storePicker } from "@common/utils/zustand";
import { RadioOuiNon } from "@components/RHF/RadioOuiNon";
import { ClientBodyPortal } from "@components/utils/ClientBodyPortal";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup, CenteredContainer, Container, Grid, GridCol, Text } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { type FieldErrors, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { NAVIGATION, simulateurPath } from "../navigation";
import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "../useSimuFunnelStore";
import { getTotalsCsp, prepareIndicateurUnComputer } from "../utils";
import style from "./Form.module.scss";
import { Indicateur2et3Note } from "./Indicateur2et3Note";

type Indic2and3FormType = ClearObject<z.infer<typeof createSteps.indicateur2and3>>;
type Indic2and3FormWhenCalculated = Extract<Indic2and3FormType, { calculable: "oui" }>;

const indicateur1Computer = new IndicateurUnComputer();
const indicateur2and3Computer = new IndicateurDeuxTroisComputer(indicateur1Computer);
const indicateur2and3Nav = NAVIGATION.indicateur2et3;

const ifAdvantageText: Record<IndicateurDeuxTroisComputer.ComputedResult["ifadvantage"], string> = {
  "men-men":
    "Si ce nombre d'hommes n'avait pas reçu d'augmentation parmi les bénéficiaires, les taux d'augmentation seraient égaux entre femmes et hommes.",
  "men-women":
    "Si ce nombre de femmes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre femmes et hommes.",
  "women-men":
    "Si ce nombre d'hommes supplémentaires avait bénéficié d'une augmentation, les taux d'augmentation seraient égaux entre femmes et hommes.",
  "women-women":
    "Si ce nombre de femmes n'avait pas reçu d'augmentation parmi les bénéficiaires, les taux d'augmentation seraient égaux entre femmes et hommes.",
  equality: "Les femmes et les hommes sont à égalité",
};

const infoModal = createModal({
  id: "info-modal",
  isOpenedByDefault: false,
});

const schemaWithMax = (totalCsp: [number, number]) =>
  createSteps.indicateur2and3.superRefine((data, ctx) => {
    if (data.calculable === "oui") {
      const [totalCspWomen, totalCspMen] = totalCsp;

      if (data.raisedCount.women > totalCspWomen) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_big,
          inclusive: true,
          maximum: totalCspWomen,
          type: "number",
          message: `Le nombre de femmes augmentées ne peut pas être supérieur au nombre de femmes dans l'entreprise (${totalCspWomen})`,
          path: ["raisedCount", "women"],
        });
      }

      if (data.raisedCount.men > totalCspMen) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_big,
          inclusive: true,
          maximum: totalCspMen,
          type: "number",
          message: `Le nombre d'hommes augmentés ne peut pas être supérieur au nombre d'hommes dans l'entreprise (${totalCspMen})`,
          path: ["raisedCount", "men"],
        });
      }
    }
  });

const useStore = storePicker(useSimuFunnelStore);

export const Indic2and3Form = () => {
  const router = useRouter();
  const [_funnel, saveFunnel] = useStore("funnel", "saveFunnel");
  const funnel = _funnel as Partial<CreateSimulationWorkforceRangeLessThan250DTO> | undefined;
  const hydrated = useSimuFunnelStoreHasHydrated();
  const [totalCspWomen, totalCspMen] = hydrated ? getTotalsCsp(funnel as CreateSimulationDTO) : [0, 0];

  if (hydrated) prepareIndicateurUnComputer(indicateur1Computer, funnel as CreateSimulationDTO);

  const methods = useForm<Indic2and3FormType>({
    mode: "onChange",
    resolver: zodResolver(schemaWithMax([totalCspWomen, totalCspMen])),
    defaultValues: funnel?.indicateur2and3,
    shouldUnregister: true,
  });

  const {
    formState: { isValid, errors },
    handleSubmit,
    register,
    watch,
    trigger,
    setValue,
    reset,
  } = methods;

  const computableCheck = watch("calculable");
  const raisedCount = watch("raisedCount");

  indicateur2and3Computer.setInput({
    men: raisedCount?.men || 0,
    menCount: totalCspMen,
    women: raisedCount?.women || 0,
    womenCount: totalCspWomen,
  });

  let computed = undefined as IndicateurDeuxTroisComputer.ComputedResult | undefined;

  const canCompute = indicateur2and3Computer.canCompute();

  if (canCompute) {
    computed = indicateur2and3Computer.compute();
  }

  useEffect(() => {
    if (!canCompute && hydrated) {
      setValue("calculable", "non", { shouldValidate: true });
    } else reset();
  }, [canCompute, setValue, hydrated, reset]);

  if (!hydrated) {
    return (
      <CenteredContainer pb="6w">
        <SkeletonForm fields={1} />
      </CenteredContainer>
    );
  }

  const onSubmit = async (formData: Indic2and3FormType) => {
    saveFunnel({ indicateur2and3: formData });
    router.push(simulateurPath(indicateur2and3Nav.next()));
  };

  const whenCalculableErrors = errors as FieldErrors<Indic2and3FormWhenCalculated>;

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <p className="fr-text--xs">Les champs suivis d'une * sont obligatoires</p>

        <ClientBodyPortal>
          <infoModal.Component title="Information indicateur écart de taux d'augmentations">
            <p>Le nombre de femmes et d’hommes augmentés au cours de la période de référence est calculé.</p>
            <p>
              Le taux d’augmentation des femmes est calculé en rapportant le nombre de femmes augmentées au nombre total
              de femmes pris en compte pour le calcul des indicateurs. Le taux d’augmentation des hommes est calculé en
              rapportant le nombre d’hommes augmentés au nombre total d’hommes pris en compte pour le calcul des
              indicateurs.
            </p>
            <p>
              Un premier résultat est "l’écart en %", il s’agit de la valeur absolue de l’écart entre les deux taux
              calculés en 2. Par exemple, le taux d’augmentation des femmes est de 33,13% et le taux d’augmentation des
              hommes est de 30,00%, l’écart est ainsi de 3,13%.
            </p>
            <p>
              Un second résultat est "l’écart en nombre équivalent de salariés", l’écart de taux calculé en 3 est
              appliqué au plus petit effectif entre les femmes et les hommes. Il correspond au plus petit nombre de
              salariés qu’il aurait fallu augmenter ou ne pas augmenter pour être à égalité des taux d’augmentation. Par
              exemple, l’écart est de 3,13% dans une entreprise employant 15 femmes et 20 hommes, on applique 3,13% aux
              15 femmes, le nombre équivalent de salariés est ainsi de 0,4695.
            </p>
            <p>L’écart en % et le nombre équivalent de salariés sont arrondis à la première décimale.</p>
          </infoModal.Component>
        </ClientBodyPortal>

        <ClientAnimate>
          {!canCompute ? (
            <Alert
              className="fr-mb-3w"
              severity="info"
              title="L'indicateur n'est pas calculable"
              description="L' effectif total pris en compte pour le calcul des indicateurs ne compte pas au moins 5 femmes et 5 hommes"
            />
          ) : (
            <>
              <RadioOuiNon
                legend="Y a-t-il eu des augmentations individuelles au cours de la période de référence considérée ? *"
                name="calculable"
                triggerValidation={true}
              />
              {computableCheck === "oui" ? (
                <>
                  <Container className={cx(fr.cx("fr-px-md-3v", "fr-px-2v", "fr-mb-6w"), style["form-input-card"])}>
                    <Grid haveGutters>
                      <GridCol className={style["form-input-card-title"]}>
                        <Text text="Nombre de salariés augmentés *" inline variant={["xl", "bold"]} mb="auto" />
                        <Button
                          title="Information indicateur écart de taux d'augmentation"
                          iconId="fr-icon-information-fill"
                          type="button"
                          size="small"
                          priority="tertiary no outline"
                          nativeButtonProps={infoModal.buttonProps}
                        />
                      </GridCol>
                      <GridCol sm={6}>
                        {(() => {
                          const field = register("raisedCount.women", {
                            setValueAs: setValueAsFloatOrEmptyString,
                          });

                          return (
                            <Input
                              label="Femmes"
                              hintText={`(max ${totalCspWomen})`}
                              state={whenCalculableErrors.raisedCount?.women && "error"}
                              stateRelatedMessage={whenCalculableErrors.raisedCount?.women?.message}
                              nativeInputProps={{
                                type: "number",
                                min: raisedCount && raisedCount.men > 0 ? 0 : 1,
                                max: totalCspWomen,
                                ...field,
                                onChange: e => {
                                  field.onChange(e);
                                  trigger();
                                },
                              }}
                            />
                          );
                        })()}
                      </GridCol>
                      <GridCol sm={6}>
                        {(() => {
                          const field = register("raisedCount.men", {
                            setValueAs: setValueAsFloatOrEmptyString,
                          });

                          return (
                            <Input
                              label="Hommes"
                              hintText={`(max ${totalCspMen})`}
                              state={whenCalculableErrors.raisedCount?.men && "error"}
                              stateRelatedMessage={whenCalculableErrors.raisedCount?.men?.message}
                              nativeInputProps={{
                                type: "number",
                                min: raisedCount && raisedCount.women > 0 ? 0 : 1,
                                max: totalCspMen,
                                ...field,
                                onChange: e => {
                                  field.onChange(e);
                                  trigger();
                                },
                              }}
                            />
                          );
                        })()}
                      </GridCol>
                      <GridCol sm={12}>
                        <Text
                          mb="1w"
                          text={
                            <>
                              Écart en valeur absolue, arrondi à la première décimale :{" "}
                              <strong>
                                {computed?.result !== undefined ? percentFormat.format(computed.result / 100) : ""}
                              </strong>
                            </>
                          }
                        />
                        <Text
                          mb="1w"
                          text={
                            <>
                              Écart en nombre équivalent de salariés, arrondi à la première décimale
                              {(raisedCount?.men || raisedCount?.women) && (
                                <strong>
                                  <sup>*</sup>
                                </strong>
                              )}{" "}
                              : <strong>{computed?.equivalentEmployeeCountGap?.toString().replace(".", ",")}</strong>
                            </>
                          }
                        />
                        {(raisedCount?.men || raisedCount?.women) && (
                          <i>
                            <Text
                              mb="1w"
                              variant={["sm"]}
                              text={
                                <>
                                  <strong>*</strong>
                                  {computed?.ifadvantage ? ifAdvantageText[computed.ifadvantage] : ""}
                                </>
                              }
                            />
                          </i>
                        )}
                      </GridCol>
                    </Grid>
                  </Container>

                  {whenCalculableErrors.raisedCount && whenCalculableErrors.raisedCount.root && (
                    <Alert
                      className="fr-mb-3w"
                      severity="error"
                      title=""
                      description={whenCalculableErrors.raisedCount.root?.message || ""}
                    />
                  )}

                  {computed && <Indicateur2et3Note computed={computed} isValid={isValid} />}
                </>
              ) : (
                computableCheck === "non" && (
                  <Alert
                    className="fr-mb-3w"
                    severity="info"
                    title="L'indicateur n'est pas calculable"
                    description="Il n'y a pas eu d'augmentations individuelles au cours de la période de référence."
                  />
                )
              )}
            </>
          )}
        </ClientAnimate>

        <BackNextButtonsGroup
          className={fr.cx("fr-mt-4w")}
          backProps={{
            linkProps: {
              href: simulateurPath(indicateur2and3Nav.prev()),
            },
          }}
          nextDisabled={!isValid}
        />
      </form>
    </FormProvider>
  );
};
