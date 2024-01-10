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
import { AideSimulationIndicateurDeuxEtTrois } from "@components/aide-simulation/IndicateurDeuxEtTrois";
import { RadioOuiNon } from "@components/RHF/RadioOuiNon";
import { ClientBodyPortal } from "@components/utils/ClientBodyPortal";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup, CenteredContainer, Container, FormLayout, Grid, GridCol, Text } from "@design-system";
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
    }
  }, [canCompute, setValue, hydrated]);

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
        <FormLayout>
          <ClientBodyPortal>
            <infoModal.Component title="Information indicateur écart de taux d'augmentation">
              <AideSimulationIndicateurDeuxEtTrois.CommentEstCalculéLIndicateur />
            </infoModal.Component>
          </ClientBodyPortal>

          <ClientAnimate>
            {!canCompute ? (
              <Alert
                className="fr-mb-3w"
                severity="info"
                title="L'indicateur n'est pas calculable"
                description="Les effectifs comprennent moins de 5 femmes ou moins de 5 hommes."
              />
            ) : (
              <>
                <RadioOuiNon
                  legend="Y a-t-il eu des augmentations individuelles durant la période de référence ?"
                  name="calculable"
                  triggerValidation={true}
                />
                {computableCheck === "oui" ? (
                  <>
                    <Container className={cx(fr.cx("fr-px-md-3v", "fr-px-2v", "fr-mb-6w"), style["form-input-card"])}>
                      <Grid haveGutters>
                        <GridCol className={style["form-input-card-title"]}>
                          <Text text="Nombre de salariés augmentés" inline variant={["xl", "bold"]} mb="auto" />
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
                                Écart en valeur absolue :{" "}
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
                                Écart en nombre équivalent de salariés
                                <strong>
                                  <sup>*</sup>
                                </strong>{" "}
                                : <strong>{computed?.equivalentEmployeeCountGap}</strong>
                              </>
                            }
                          />
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
                      description="Il n'y a pas eu d'augmentations durant la période de référence."
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
        </FormLayout>
      </form>
    </FormProvider>
  );
};
