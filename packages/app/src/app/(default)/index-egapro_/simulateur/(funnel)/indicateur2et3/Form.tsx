"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { IndicateurDeuxTroisComputer } from "@common/core-domain/computers/IndicateurDeuxTroisComputer";
import {
  type CreateSimulationDTO,
  type CreateSimulationWorkforceRangeLessThan250DTO,
  createSteps,
} from "@common/core-domain/dtos/CreateSimulationDTO";
import { type ClearObject } from "@common/utils/types";
import { storePicker } from "@common/utils/zustand";
import { AideSimulationIndicateurDeuxEtTrois } from "@components/aide-simulation/IndicateurDeuxEtTrois";
import { ClientBodyPortal } from "@components/utils/ClientBodyPortal";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup, Container, FormLayout, Grid, GridCol, Text } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, type FieldErrors, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { NAVIGATION, simulateurPath } from "../navigation";
import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "../useSimuFunnelStore";
import { getResultIndicateurUn, getTotalsCsp } from "../utils";
import style from "./Form.module.scss";
import { Indicateur2et3Note } from "./Indicateur2et3Note";

type Indic2and3FormType = ClearObject<z.infer<typeof createSteps.indicateur2and3>>;
type Indic2and3FormWhenCalculated = Extract<Indic2and3FormType, { calculable: true }>;

const indicateur2and3Computer = new IndicateurDeuxTroisComputer();
const indicateur2and3Nav = NAVIGATION.indicateur2et3;

const infoModal = createModal({
  id: "info-modal",
  isOpenedByDefault: false,
});

const useStore = storePicker(useSimuFunnelStore);
export const Indic2and3Form = () => {
  const router = useRouter();
  const [_funnel, saveFunnel] = useStore("funnel", "saveFunnel");
  const funnel = _funnel as Partial<CreateSimulationWorkforceRangeLessThan250DTO> | undefined;
  const hydrated = useSimuFunnelStoreHasHydrated();

  const [lastRaisedCount, setLastRaisedCount] = useState<Indic2and3FormWhenCalculated["raisedCount"]>();

  const schemaWithMax = createSteps.indicateur2and3.superRefine((data, ctx) => {
    if (data.calculable && funnel) {
      const [totalCspWomen, totalCspMen] = getTotalsCsp(funnel as CreateSimulationDTO);

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

  const methods = useForm<Indic2and3FormType>({
    mode: "onChange",
    resolver: zodResolver(schemaWithMax),
    defaultValues: funnel?.indicateur2and3,
  });

  const {
    formState: { isValid, errors },
    handleSubmit,
    register,
    watch,
    getValues,
    reset,
    trigger,
    control,
  } = methods;

  if (!hydrated) {
    return <SkeletonForm fields={2} />;
  }

  if (!funnel?.effectifs) {
    redirect(simulateurPath("effectifs"));
  }

  if (!funnel.indicateur1) {
    redirect(simulateurPath("indicateur1"));
  }

  const computableCheck = watch("calculable");
  const [totalCspWomen, totalCspMen] = getTotalsCsp(funnel as CreateSimulationDTO);
  const resultIndicateurUn = getResultIndicateurUn(funnel as CreateSimulationDTO);

  const raisedCount = watch("raisedCount");

  indicateur2and3Computer.setInput({
    men: raisedCount?.men || 0,
    menCount: totalCspMen,
    women: raisedCount?.women || 0,
    womenCount: totalCspWomen,
  });

  const canCompute = indicateur2and3Computer.canCompute();
  if (canCompute) {
    indicateur2and3Computer.compute();
  } else {
    register("calculable", { value: false });
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
                severity="warning"
                title="L'indicateur n'est pas calculable"
                description="L’ensemble des groupes valides (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs."
              />
            ) : (
              <>
                <Controller
                  control={control}
                  name="calculable"
                  render={({ field, fieldState }) => (
                    <RadioButtons
                      orientation="horizontal"
                      legend="Y a-t-il eu des augmentations individuelles durant la période de référence ?"
                      state={fieldState.error && "error"}
                      stateRelatedMessage={fieldState.error?.message}
                      options={[
                        {
                          label: "Oui",
                          nativeInputProps: {
                            ...field,
                            value: 1,
                            defaultChecked: field.value === true,
                            onChange() {
                              reset({
                                calculable: true,
                                raisedCount: lastRaisedCount,
                              });
                              trigger("raisedCount");
                              setLastRaisedCount(void 0);
                              field.onChange(true);
                            },
                          },
                        },
                        {
                          label: "Non",
                          nativeInputProps: {
                            ...field,
                            value: 0,
                            defaultChecked: field.value === false,
                            onChange() {
                              setLastRaisedCount(getValues("raisedCount"));
                              reset({
                                calculable: false,
                              });
                              field.onChange(false);
                            },
                          },
                        },
                      ]}
                    />
                  )}
                />
                {computableCheck ? (
                  <>
                    <Container className={cx(fr.cx("fr-px-md-3v", "fr-px-2v", "fr-mb-6w"), style["form-input-card"])}>
                      <Grid haveGutters>
                        <GridCol className={style["form-input-card-title"]}>
                          <Text text="Nombre de salaries augmentés" inline variant={["xl", "bold"]} mb="auto" />
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
                          <Input
                            label="Femmes"
                            hintText={`(max ${totalCspWomen})`}
                            state={whenCalculableErrors.raisedCount?.women && "error"}
                            stateRelatedMessage={whenCalculableErrors.raisedCount?.women?.message}
                            nativeInputProps={{
                              ...register("raisedCount.women", {
                                setValueAs: value => (value === "" ? void 0 : +value),
                                deps: "raisedCount.men",
                              }),
                              type: "number",
                              min: raisedCount && raisedCount.men > 0 ? 1 : 0,
                              max: totalCspWomen,
                            }}
                          />
                        </GridCol>
                        <GridCol sm={6}>
                          <Input
                            label="Hommes"
                            hintText={`(max ${totalCspMen})`}
                            state={whenCalculableErrors.raisedCount?.men && "error"}
                            stateRelatedMessage={whenCalculableErrors.raisedCount?.men?.message}
                            nativeInputProps={{
                              ...register("raisedCount.men", {
                                setValueAs: value => (value === "" ? void 0 : +value),
                                deps: "raisedCount.women",
                              }),
                              type: "number",
                              min: raisedCount && raisedCount.women > 0 ? 1 : 0,
                              max: totalCspMen,
                            }}
                          />
                        </GridCol>
                      </Grid>
                    </Container>

                    <Indicateur2et3Note computer={indicateur2and3Computer} resultIndicateurUn={resultIndicateurUn} />
                  </>
                ) : (
                  computableCheck === false && (
                    <Alert
                      className="fr-mb-3w"
                      severity="info"
                      title="L'indicateur n'est pas calculable"
                      description={`Il n'y a pas eu d'augmentations durant la période de référence.`}
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
